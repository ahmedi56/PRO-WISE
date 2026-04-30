/**
 * GuideTypeController
 *
 * @description :: Server-side actions for managing guide types.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {

  /**
     * GET /api/guidetypes
     * List all guide types
     */
  getAll: async function (req, res) {
    try {
      const types = await GuideType.find().sort('sortOrder ASC').sort('name ASC');
      return res.json(types);
    } catch (err) {
      sails.log.error('Get guide types error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
     * POST /api/guidetypes
     * Create a new guide type (admin only)
     */
  create: async function (req, res) {
    try {
      const { name, slug, description, icon } = req.body;
      if (!name) {return res.status(400).json({ message: 'Name is required' });}

      // Auto-generate slug if not provided
      const effectiveSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const newType = await GuideType.create({ name, slug: effectiveSlug, description, icon }).fetch();
      return res.status(201).json(newType);
    } catch (err) {
      if (err.code === 'E_UNIQUE') {
        return res.status(400).json({ message: 'Guide Type already exists' });
      }
      sails.log.error('Create guide type error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Future: update, delete

};
