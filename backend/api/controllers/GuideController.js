const logAction = async (req, options) => {
  if (sails.services.auditservice) {
    await sails.services.auditservice.log(req, options);
  }
};

module.exports = {

  /**
     * POST /api/guides
     * Create a new guide
     */
  create: async function (req, res) {
    try {
      const { title, difficulty, estimatedTime, product } = req.body;

      if (!title || !product) {
        return res.status(400).json({ message: 'Title and product are required' });
      }

      // Verify product exists and check tenant isolation
      const parentProduct = await Product.findOne({ id: product });
      if (!parentProduct) {
        return res.status(404).json({ message: 'Product not found' });
      }

      if (req.user && req.user.companyId && String(parentProduct.company) !== String(req.user.companyId)) {
        return res.status(403).json({ message: 'Forbidden: Product does not belong to your company' });
      }

      const guide = await Guide.create({
        title,
        difficulty: difficulty || 'medium',
        estimatedTime,
        product,
        status: 'draft',
        createdBy: req.user.id
      }).fetch();

      await logAction(req, {
        action: 'guide.created',
        target: guide.id,
        targetType: 'Guide',
        targetLabel: guide.title
      });

      return res.status(201).json(guide);

    } catch (err) {
      sails.log.error('Create guide error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
     * PUT /api/guides/:id
     * Update a guide
     */
  update: async function (req, res) {
    try {
      const { title, content } = req.body;

      const existing = await Guide.findOne({ id: req.params.id }).populate('product');
      if (!existing) {
        return res.status(404).json({ message: 'Guide not found' });
      }

      const isOwner = existing.createdBy === req.user.id || (req.user.companyId && existing.product && String(existing.product.company) === String(req.user.companyId));
      if (!req.user || !isOwner) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const updateData = {};
      if (title !== undefined) {updateData.title = title;}
      if (content !== undefined) {updateData.content = content;}

      const guide = await Guide.updateOne({ id: req.params.id }).set(updateData);
      
      await logAction(req, {
        action: 'guide.updated',
        target: guide.id,
        targetType: 'Guide',
        targetLabel: guide.title,
        details: { changedFields: Object.keys(updateData) }
      });

      return res.json(guide);

    } catch (err) {
      sails.log.error('Update guide error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
     * DELETE /api/guides/:id
     * Delete a guide
     */
  delete: async function (req, res) {
    try {
      const existing = await Guide.findOne({ id: req.params.id }).populate('product');
      if (!existing) {
        return res.status(404).json({ message: 'Guide not found' });
      }

      const isOwner = existing.createdBy === req.user.id || (req.user.companyId && existing.product && String(existing.product.company) === String(req.user.companyId));
      if (!req.user || !isOwner) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      await Guide.destroyOne({ id: req.params.id });

      await logAction(req, {
        action: 'guide.deleted',
        target: existing.id,
        targetType: 'Guide',
        targetLabel: existing.title,
        severity: 'warning'
      });

      return res.json({ message: 'Guide deleted successfully' });

    } catch (err) {
      sails.log.error('Delete guide error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
   * PUT /api/guides/:id/submit
   */
  submit: async function (req, res) {
    try {
      const existing = await Guide.findOne({ id: req.params.id }).populate('product');
      if (!existing) {return res.status(404).json({ message: 'Guide not found' });}

      const isOwner = existing.createdBy === req.user.id || (req.user.companyId && existing.product && String(existing.product.company) === String(req.user.companyId));
      if (!req.user || !isOwner) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      if (existing.status !== 'draft' && existing.status !== 'rejected') {
        return res.status(400).json({ message: 'Only draft or rejected guides can be submitted' });
      }

      const guide = await Guide.updateOne({ id: req.params.id }).set({ status: 'pending' });

      await logAction(req, {
        action: 'guide.submitted',
        target: guide.id,
        targetType: 'Guide',
        targetLabel: guide.title
      });

      return res.json({ message: 'Guide submitted for approval', guide });
    } catch (err) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
   * PUT /api/guides/:id/approve
   * Super Admin only
   */
  approve: async function (req, res) {
    try {
      // Role check handled by policy, but we can double check
      const user = await User.findOne({ id: req.user.id }).populate('role');
      if (user.role.name !== 'super_admin') {
        return res.status(403).json({ message: 'Forbidden: Super Admin only' });
      }

      const existing = await Guide.findOne({ id: req.params.id });
      if (!existing) {return res.status(404).json({ message: 'Guide not found' });}

      if (existing.status !== 'pending') {
        return res.status(400).json({ message: 'Only pending guides can be approved' });
      }

      const guide = await Guide.updateOne({ id: req.params.id }).set({ status: 'published' });

      await logAction(req, {
        action: 'guide.published', // Approved guides are published
        target: guide.id,
        targetType: 'Guide',
        targetLabel: guide.title,
        details: { context: 'admin_approval' }
      });

      return res.json({ message: 'Guide approved and published', guide });
    } catch (err) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
   * PUT /api/guides/:id/reject
   * Super Admin only
   */
  reject: async function (req, res) {
    try {
      const user = await User.findOne({ id: req.user.id }).populate('role');
      if (user.role.name !== 'super_admin') {
        return res.status(403).json({ message: 'Forbidden: Super Admin only' });
      }

      const existing = await Guide.findOne({ id: req.params.id });
      if (!existing) {return res.status(404).json({ message: 'Guide not found' });}

      if (existing.status !== 'pending') {
        return res.status(400).json({ message: 'Only pending guides can be rejected' });
      }

      const guide = await Guide.updateOne({ id: req.params.id }).set({ status: 'rejected' });

      await logAction(req, {
        action: 'guide.rejected',
        target: guide.id,
        targetType: 'Guide',
        targetLabel: guide.title,
        severity: 'warning'
      });

      return res.json({ message: 'Guide rejected', guide });
    } catch (err) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
   * PUT /api/guides/:id/unpublish
   */
  unpublish: async function (req, res) {
    try {
      const existing = await Guide.findOne({ id: req.params.id }).populate('product');
      if (!existing) {return res.status(404).json({ message: 'Guide not found' });}

      const isOwner = existing.createdBy === req.user.id || (req.user.companyId && existing.product && String(existing.product.company) === String(req.user.companyId));
      if (!req.user || !isOwner) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const guide = await Guide.updateOne({ id: req.params.id }).set({ status: 'draft' });

      await logAction(req, {
        action: 'guide.unpublished',
        target: guide.id,
        targetType: 'Guide',
        targetLabel: guide.title
      });

      return res.json({ message: 'Guide unpublished', guide });
    } catch (err) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
   * PUT /api/guides/:id/publish
   */
  publish: async function (req, res) {
    try {
      const existing = await Guide.findOne({ id: req.params.id }).populate('product');
      if (!existing) {return res.status(404).json({ message: 'Guide not found' });}

      const isOwner = existing.createdBy === req.user.id || (req.user.companyId && existing.product && String(existing.product.company) === String(req.user.companyId));
      if (!req.user || !isOwner) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const guide = await Guide.updateOne({ id: req.params.id }).set({ status: 'published' });

      await logAction(req, {
        action: 'guide.published',
        target: guide.id,
        targetType: 'Guide',
        targetLabel: guide.title
      });

      return res.json({ message: 'Guide published', guide });
    } catch (err) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
     * PUT /api/guides/:id/archive
     */
  archive: async function (req, res) {
    try {
      const existing = await Guide.findOne({ id: req.params.id }).populate('product');
      if (!existing) {return res.status(404).json({ message: 'Guide not found' });}

      const isOwner = existing.createdBy === req.user.id || (req.user.companyId && existing.product && String(existing.product.company) === String(req.user.companyId));
      if (!req.user || !isOwner) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const guide = await Guide.updateOne({ id: req.params.id }).set({ status: 'archived' });

      await logAction(req, {
        action: 'guide.archived',
        target: guide.id,
        targetType: 'Guide',
        targetLabel: guide.title
      });

      return res.json({ message: 'Guide archived', guide });
    } catch (err) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
     * upload()
     *
     * @description :: Upload a new guide document (legacy/stub).
     */
  upload: async function (req, res) {
    return res.status(501).json({
      message: 'Guide upload feature is not yet implemented.',
      success: false
    });
  }

};
