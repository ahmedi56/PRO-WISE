const logAction = async (req, options) => {
  if (sails.services.auditservice) {
    await sails.services.auditservice.log(req, options);
  }
};

module.exports = {

  // admin company creates content -> status = draft
  create: async function (req, res) {
    try {
      const { title, description, type, steps, media, videoId, fileUrl, difficulty, estimatedTime, answer, product } = req.body;
      if (!title || !description || !product) {
        return res.badRequest({ error: 'Missing data: title, description, and product are required' });
      }

      // Check product and get its company
      const productRecord = await Product.findOne({ id: product });
      if (!productRecord) {
        return res.badRequest({ error: 'Product not found' });
      }
      
      const companyId = productRecord.company || null;
      
      // Determine user role
      const userRole = typeof req.user?.role === 'object' ? req.user?.role?.name : req.user?.role;
      const isCompanyAdmin = userRole === 'company_admin' || userRole === 'administrator' || userRole === 'super_admin';
      
      // Non-admins can only create FAQ questions
      if (!isCompanyAdmin && type !== 'faq') {
        return res.forbidden({ error: 'Unauthorized: Requires Company Admin role to create this content type' });
      }

      const isFaq = type === 'faq';
      const finalAnswer = isCompanyAdmin ? (answer || null) : null;
      const status = isCompanyAdmin ? 'draft' : 'pending';

      const newContent = await Content.create({
        title,
        description,
        type: type || 'general',
        steps: steps || [],
        media: media || [],
        videoId: videoId || null,
        fileUrl: fileUrl || null,
        difficulty: difficulty || 'medium',
        estimatedTime: estimatedTime || null,
        answer: finalAnswer,
        question: isFaq ? description : null,
        product: productRecord.id,
        status,
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
      
      // Determine user role and permissions
      const userRole = typeof req.user?.role === 'object' ? req.user?.role?.name : req.user?.role;
      const isSuperAdmin = userRole === 'super_admin';
      const isCompanyAdmin = userRole === 'company_admin' || userRole === 'administrator';
      const isTechnician = userRole === 'technician';
      
      const isCreator = content.createdBy === req.user.id;
      const isSameCompany = req.user.companyId && String(content.company) === String(req.user.companyId);

      let allowed = false;
      let onlyAnswer = false;
      let answeredBy = content.answeredBy || null;

      if (isSuperAdmin || (isCompanyAdmin && isSameCompany)) {
        // Admins can edit anything
        allowed = true;
      } else if (content.type === 'faq') {
        if (isTechnician) {
          // Technicians can answer or edit their own answer
          if (!content.answer) {
            allowed = true;
            onlyAnswer = true;
            answeredBy = req.user.id;
          } else if (content.answeredBy && String(content.answeredBy) === String(req.user.id)) {
            allowed = true;
            onlyAnswer = true;
          }
        } else if (isCreator && !content.answer) {
          // Creators can edit their own unanswered question
          allowed = true;
        }
      } else {
        // Non-FAQs: must be creator or same company admin (bypassed above)
        if (isCreator || isSameCompany) {
          allowed = true;
        }
      }

      if (!allowed) {
        return res.forbidden({ error: 'Unauthorized: You do not have permission to update this content' });
      }

      // Check staff constraint on answer modification and other fields
      const isStaff = isSuperAdmin || isCompanyAdmin || isTechnician;
      if (!isStaff) {
        const allowedFields = ['title', 'description'];
        const keys = Object.keys(req.body);
        const hasDisallowedFields = keys.some(key => !allowedFields.includes(key) && req.body[key] !== undefined && req.body[key] !== content[key]);
        if (hasDisallowedFields) {
          return res.forbidden({ error: 'Unauthorized: Customers can only update the question title and description' });
        }
      }

      let updatedData = {};

      if (onlyAnswer) {
        // Technicians can only update the answer field
        if (req.body.answer === undefined || req.body.answer === null || req.body.answer.trim() === '') {
          return res.badRequest({ error: 'Answer is required' });
        }
        updatedData = {
          answer: req.body.answer,
          answeredBy: answeredBy,
          status: 'approved' // Automatically approve answered FAQ
        };
      } else {
        // Full update for admins/creators
        const isFaq = (req.body.type || content.type) === 'faq';
        const isStaff = isSuperAdmin || isCompanyAdmin || isTechnician;
        const newAnswer = isStaff ? (req.body.answer !== undefined ? req.body.answer : content.answer) : content.answer;
        const newStatus = (isFaq && newAnswer) ? 'approved' : (content.status === 'approved' ? 'draft' : content.status);

        updatedData = {
          status: newStatus,
          title: req.body.title || content.title,
          description: req.body.description || content.description,
          type: req.body.type || content.type,
          steps: req.body.steps || content.steps,
          media: req.body.media || content.media,
          difficulty: req.body.difficulty || content.difficulty,
          estimatedTime: req.body.estimatedTime || content.estimatedTime,
          answer: newAnswer,
          question: isFaq ? (req.body.description || content.description) : null,
          videoId: req.body.videoId !== undefined ? req.body.videoId : content.videoId,
          fileUrl: req.body.fileUrl !== undefined ? req.body.fileUrl : content.fileUrl,
          product: req.body.product || content.product,
          answeredBy: (isStaff && newAnswer) ? (content.answeredBy || req.user.id) : content.answeredBy
        };
      }

      const updated = await Content.updateOne({ id: contentId }).set(updatedData);

      await logAction(req, {
        action: 'content.updated',
        target: updated.id,
        targetType: 'Content',
        targetLabel: updated.title,
        details: { 
          changedFields: Object.keys(req.body),
          statusReset: content.status === 'approved' && updated.status === 'draft'
        }
      });

      if (content.status === 'approved' && updated.status === 'draft') {
        try {
          await Notification.create({
            user: req.user.id,
            title: 'Content Status Reset',
            message: `"${updated.title}" has been reset to Draft status because it was modified. Please submit it for approval again.`,
            type: 'warning',
            link: `/admin/support/${updated.id}/edit`
          });
        } catch (nErr) {
          sails.log.error('Failed to create status reset notification:', nErr);
        }
      }

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

      const userRole = typeof req.user?.role === 'object' ? req.user?.role?.name : req.user?.role;
      const isSuperAdmin = userRole === 'super_admin';
      const isOwner = content.createdBy === req.user.id || (req.user.companyId && String(content.company) === String(req.user.companyId));
      if (!req.user || (!isSuperAdmin && !isOwner)) {
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
              type: 'info',
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

      const userRole = typeof req.user?.role === 'object' ? req.user?.role?.name : req.user?.role;
      const isSuperAdmin = userRole === 'super_admin';
      const isOwner = content.createdBy === req.user.id || (req.user.companyId && String(content.company) === String(req.user.companyId));
      if (!req.user || (!isSuperAdmin && !isOwner)) {
        return res.forbidden({ error: 'Unauthorized access: This content is not public' });
      }

      return res.ok(content);
    } catch (e) {
      return res.serverError(e);
    }
  },

  /**
   * DELETE /api/content/:id
   * Delete content (Owner or Super Admin only)
   */
  delete: async function (req, res) {
    try {
      const contentId = req.params.id;
      const content = await Content.findOne({ id: contentId });
      
      if (!content) {
        return res.notFound({ error: 'Content not found' });
      }

      const userRole = typeof req.user?.role === 'object' ? req.user?.role?.name : req.user?.role;
      const isSuperAdmin = userRole === 'super_admin';
      const isCompanyAdmin = userRole === 'company_admin' || userRole === 'administrator';
      const isCreator = content.createdBy === req.user.id;
      const isSameCompany = req.user.companyId && String(content.company) === String(req.user.companyId);

      let allowed = false;
      if (isSuperAdmin || (isCompanyAdmin && isSameCompany)) {
        allowed = true;
      } else if (isCreator) {
        if (content.type === 'faq' && (content.answer || content.status === 'approved')) {
          allowed = false;
        } else {
          allowed = true;
        }
      }

      if (!allowed) {
        return res.forbidden({ error: 'Unauthorized: You do not have permission to delete this content' });
      }

      await Content.destroyOne({ id: contentId });

      await logAction(req, {
        action: 'content.deleted',
        target: content.id,
        targetType: 'Content',
        targetLabel: content.title,
        severity: 'warning'
      });

      return res.ok({ message: 'Content deleted successfully' });
    } catch (e) {
      sails.log.error('Delete content error:', e);
      return res.serverError(e);
    }
  }

};
