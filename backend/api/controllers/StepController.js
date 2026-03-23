/**
 * StepController
 *
 * @description :: Server-side actions for handling guide steps.
 */

module.exports = {

  /**
   * POST /api/steps
   * Create a new step for a guide.
   */
  create: async function (req, res) {
    try {
      const { guideId, stepNumber, title, description } = req.body;

      if (!guideId || !stepNumber || !title) {
        return res.status(400).json({ message: 'Guide ID, step number, and title are required' });
      }

      // Verify guide exists and check tenant isolation
      const guide = await Guide.findOne({ id: guideId }).populate('product');
      if (!guide) {
        return res.status(404).json({ message: 'Guide not found' });
      }

      if (req.user && req.user.companyId && String(guide.product.company) !== String(req.user.companyId)) {
        return res.status(403).json({ message: 'Forbidden: Guide does not belong to your company' });
      }

      const step = await Step.create({
        guide: guideId,
        stepNumber,
        title,
        description
      }).fetch();

      return res.status(201).json(step);

    } catch (err) {
      sails.log.error('Create step error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

};
