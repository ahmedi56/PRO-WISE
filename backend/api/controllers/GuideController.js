/**
 * GuideController
 *
 * @description :: Server-side actions for handling guides.
 */

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
        status: 'draft'
      }).fetch();

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

      if ((req.user && req.user.companyId) && existing.product && existing.product.company !== (req.user && req.user.companyId)) {
        return res.status(403).json({ message: 'Forbidden: Guide does not belong to your company' });
      }

      const updateData = {};
      if (title !== undefined) {updateData.title = title;}
      if (content !== undefined) {updateData.content = content;}

      const guide = await Guide.updateOne({ id: req.params.id }).set(updateData);
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

      if ((req.user && req.user.companyId) && existing.product && existing.product.company !== (req.user && req.user.companyId)) {
        return res.status(403).json({ message: 'Forbidden: Guide does not belong to your company' });
      }

      await Guide.destroyOne({ id: req.params.id });
      return res.json({ message: 'Guide deleted successfully' });

    } catch (err) {
      sails.log.error('Delete guide error:', err);
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

      if ((req.user && req.user.companyId) && existing.product && existing.product.company !== (req.user && req.user.companyId)) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const guide = await Guide.updateOne({ id: req.params.id }).set({ status: 'published' });
      return res.json({ message: 'Guide published', guide });
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

      if ((req.user && req.user.companyId) && existing.product && existing.product.company !== (req.user && req.user.companyId)) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const guide = await Guide.updateOne({ id: req.params.id }).set({ status: 'draft' });
      return res.json({ message: 'Guide unpublished', guide });
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

      if ((req.user && req.user.companyId) && existing.product && existing.product.company !== (req.user && req.user.companyId)) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const guide = await Guide.updateOne({ id: req.params.id }).set({ status: 'archived' });
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
