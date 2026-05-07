const logAction = async (req, options) => {
  if (sails.services.auditservice) {
    await sails.services.auditservice.log(req, options);
  }
};

module.exports = {

  // admin company creates content -> status = draft
  create: async function (req, res) {
    try {
      const { title, description, type, steps, media, videoId, fileUrl } = req.body;
      if (!title || !description) {
        return res.badRequest({ error: 'Missing data: title and description are required' });
      }

      const companyId = req.user.companyId || req.user.company || null;
      const newContent = await Content.create({
        title,
        description,
        type: type || 'general',
        steps: steps || [],
        media: media || [],
        videoId: videoId || null,
        fileUrl: fileUrl || null,
        status: 'draft',
        company: companyId,
        createdBy: req.user.id
      }).fetch();

      await logAction(req, {
        action: 'content.created',
        target: newContent.id,
        targetType: 'Content',
        targetLabel: newContent.title
      });

      return res.ok(newContent);
    } catch (e) {
      return res.serverError(e);
    }
  },

  // admin company updates content
  update: async function (req, res) {
    try {
      const contentId = req.params.id;
      const content = await Content.findOne({ id: contentId });
      
      if (!content) {return res.notFound({ error: 'Content not found' });}
      
      const isOwner = content.createdBy === req.user.id || (req.user.companyId && String(content.company) === String(req.user.companyId));
      if (!req.user || !isOwner) {
        return res.forbidden({ error: 'Unauthorized access: You do not own this content' });
      }

      // Can edit only draft/rejected
      if (content.status !== 'draft' && content.status !== 'rejected') {
        return res.badRequest({ error: 'Invalid status change: You can only edit draft or rejected content' });
      }

      const updated = await Content.updateOne({ id: contentId }).set({
        title: req.body.title || content.title,
        description: req.body.description || content.description,
        type: req.body.type || content.type,
        steps: req.body.steps || content.steps,
        media: req.body.media || content.media,
        videoId: req.body.videoId !== undefined ? req.body.videoId : content.videoId,
        fileUrl: req.body.fileUrl !== undefined ? req.body.fileUrl : content.fileUrl
      });

      await logAction(req, {
        action: 'content.updated',
        target: updated.id,
        targetType: 'Content',
        targetLabel: updated.title,
        details: { 
          changedFields: Object.keys(req.body)
        }
      });

      return res.ok(updated);
    } catch (e) {
      return res.serverError(e);
    }
  },

  // Submit content: PUT /content/:id/submit
  submit: async function (req, res) {
    try {
      const contentId = req.params.id;
      const content = await Content.findOne({ id: contentId });

      if (!content) {return res.notFound({ error: 'Content not found' });}

      const isOwner = content.createdBy === req.user.id || (req.user.companyId && String(content.company) === String(req.user.companyId));
      if (!req.user || !isOwner) {
        return res.forbidden({ error: 'Unauthorized access: You do not own this content' });
      }

      // Can only submit if draft or rejected
      if (content.status !== 'draft' && content.status !== 'rejected') {
        return res.badRequest({ error: 'Invalid status change: Only draft or rejected content can be submitted' });
      }

      const TIMEOUT = process.env.AUTO_APPROVAL_TIMEOUT_MS 
        ? parseInt(process.env.AUTO_APPROVAL_TIMEOUT_MS, 10) 
        : 24 * 60 * 60 * 1000;

      const submitted = await Content.updateOne({ id: contentId }).set({
        status: 'pending',
        submittedAt: Date.now(),
        reviewDeadlineAt: Date.now() + TIMEOUT,
        approvedBy: null,
        needsManualReview: false
      });

      await logAction(req, {
        action: 'content.submitted',
        target: submitted.id,
        targetType: 'Content',
        targetLabel: submitted.title
      });

      // Notify creator
      try {
        await Notification.create({
          title: 'Content Submitted',
          message: `Your content "${submitted.title}" has been submitted for approval.`,
          type: 'info',
          user: submitted.createdBy,
          link: `/admin/support/${submitted.id}/edit`
        });

        // Notify Super Admins
        const superAdminRole = await Role.findOne({ name: 'super_admin' });
        if (superAdminRole) {
          const admins = await User.find({ role: superAdminRole.id });
          for (const admin of admins) {
            await Notification.create({
              user: admin.id,
              title: 'New Content Submission',
              message: `"${content.title}" has been submitted for approval.`,
              type: 'approval_request',
              link: '/admin/content/pending'
            });
          }
        }

        // ─── Trigger Immediate AI Review ──────────────────────────
        // Run in background (fire and forget for the request)
        if (sails.services.contentapprovalservice) {
          sails.services.contentapprovalservice.runAutoApproval(contentId).catch(err => {
            sails.log.error('Immediate AI review trigger failed:', err);
          });
        }

        return res.json({ 
          message: 'Content submitted successfully and is under AI review.', 
          content: submitted 
        });
      } catch (err) {
        sails.log.error('Failed to create notifications on submit:', err);
      }

      return res.ok(submitted);
    } catch (e) {
      return res.serverError(e);
    }
  },

  // Get pending content for Super Admin (Unified Queue)
  getPending: async function (req, res) {
    try {
      const pendingContent = await Content.find({ status: 'pending' }).populate('company').populate('createdBy');
      const pendingProducts = await Product.find({ status: 'pending' }).populate('company').populate('createdBy');
      const pendingGuides = await Guide.find({ status: 'pending' }).populate('product').populate('createdBy');

      // Unify the list with consistent shape
      const unified = [
        ...pendingContent.map(c => ({
          id: c.id,
          title: c.title,
          type: 'general',
          status: c.status,
          submittedAt: c.submittedAt,
          author: c.createdBy,
          company: c.company,
          needsManualReview: c.needsManualReview,
          autoReview: c.autoReview
        })),
        ...pendingProducts.map(p => ({
          id: p.id,
          title: p.name,
          type: 'product',
          status: p.status,
          submittedAt: p.submittedAt,
          author: p.createdBy,
          company: p.company
        })),
        ...pendingGuides.map(g => ({
          id: g.id,
          title: g.title,
          type: 'guide',
          status: g.status,
          submittedAt: g.submittedAt,
          author: g.createdBy,
          company: g.product?.company
        }))
      ];

      // Sort by submittedAt
      unified.sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0));

      return res.ok(unified);
    } catch (e) {
      return res.serverError(e);
    }
  },

  // Super Admin approves content (Polymorphic: handles Content, Product, Guide)
  approve: async function (req, res) {
    try {
      const id = req.params.id;
      let item = await Content.findOne({ id });
      let type = 'content';
      let Model = Content;
      let label = '';

      if (!item) {
        item = await Product.findOne({ id });
        if (item) {
          type = 'product';
          Model = Product;
          label = item.name;
        }
      } else {
        label = item.title;
      }

      if (!item && !label) {
        item = await Guide.findOne({ id });
        if (item) {
          type = 'guide';
          Model = Guide;
          label = item.title;
        }
      }

      if (!item) {return res.notFound({ error: 'Item not found in any supported models' });}

      if (item.status !== 'pending') {
        return res.badRequest({ error: `Invalid status: Cannot approve item with status ${item.status}` });
      }

      const isManual = type === 'content';
      const approved = await Model.updateOne({ id }).set({
        status: isManual ? 'approved' : 'published',
        approvedBy: isManual ? 'admin' : req.user.id,
        needsManualReview: false
      });

      await logAction(req, {
        action: `${type}.activated`,
        target: approved.id,
        targetType: type.charAt(0).toUpperCase() + type.slice(1),
        targetLabel: label,
        details: { context: 'admin_approval' }
      });

      // Notify creator
      try {
        await Notification.create({
          user: approved.createdBy,
          title: `${type.charAt(0).toUpperCase() + type.slice(1)} Approved`,
          message: `Your ${type} "${label}" has been approved and is now active.`,
          type: 'success',
          link: type === 'content' ? '/admin/support' : `/${type}s/${approved.id}`
        });
      } catch (err) {
        sails.log.error('Failed to create notification on approve:', err);
      }

      return res.ok(approved);
    } catch (e) {
      sails.log.error('Approve error:', e);
      return res.serverError(e);
    }
  },

  // Super Admin rejects content (Polymorphic: handles Content, Product, Guide)
  reject: async function (req, res) {
    try {
      const id = req.params.id;
      const rejectionReason = req.body.reason || 'No reason provided';
      
      let item = await Content.findOne({ id });
      let type = 'content';
      let Model = Content;
      let label = '';

      if (!item) {
        item = await Product.findOne({ id });
        if (item) {
          type = 'product';
          Model = Product;
          label = item.name;
        }
      } else {
        label = item.title;
      }

      if (!item && !label) {
        item = await Guide.findOne({ id });
        if (item) {
          type = 'guide';
          Model = Guide;
          label = item.title;
        }
      }

      if (!item) {return res.notFound({ error: 'Item not found' });}

      if (item.status !== 'pending') {
        return res.badRequest({ error: `Invalid status: Cannot reject item with status ${item.status}` });
      }

      const rejected = await Model.updateOne({ id }).set({
        status: 'rejected',
        rejectionReason: type === 'content' ? rejectionReason : undefined // Product/Guide might not have rejectionReason field, but we check
      });

      await logAction(req, {
        action: `${type}.rejected`,
        target: rejected.id,
        targetType: type.charAt(0).toUpperCase() + type.slice(1),
        targetLabel: label,
        severity: 'warning',
        details: { reason: rejectionReason }
      });

      // Notify creator
      try {
        await Notification.create({
          user: rejected.createdBy,
          title: `${type.charAt(0).toUpperCase() + type.slice(1)} Rejected`,
          message: `Your ${type} "${label}" was rejected. Reason: ${rejectionReason}`,
          type: 'error',
          link: type === 'content' ? `/admin/support/${rejected.id}/edit` : `/${type}s/${rejected.id}/edit`
        });
      } catch (err) {
        sails.log.error('Failed to create notification on reject:', err);
      }

      return res.ok(rejected);
    } catch (e) {
      sails.log.error('Reject error:', e);
      return res.serverError(e);
    }
  },

  // Get all content with visibility rules
  find: async function (req, res) {
    try {
      const companyId = req.user.companyId || req.user.company;
      // Admin/Technician can see their own
      const myContents = await Content.find({
        or: [
          { company: companyId },
          { createdBy: req.user.id }
        ]
      }).populate('company').populate('createdBy');
      return res.json({
        data: myContents,
        meta: { total: myContents.length }
      });
    } catch (e) {
      return res.serverError(e);
    }
  },

  findOne: async function (req, res) {
    try {
      const content = await Content.findOne({ id: req.params.id });
      if (!content) {return res.notFound({ error: 'Content not found' });}

      // Check visibility rules
      if (content.status === 'approved') {return res.ok(content);}

      const isOwner = content.createdBy === req.user.id || (req.user.companyId && String(content.company) === String(req.user.companyId));
      if (!req.user || !isOwner) {
        return res.forbidden({ error: 'Unauthorized access: This content is not public' });
      }

      return res.ok(content);
    } catch (e) {
      return res.serverError(e);
    }
  }

};
