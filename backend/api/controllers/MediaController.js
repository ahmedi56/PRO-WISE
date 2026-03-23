/**
 * MediaController
 *
 * @description :: Server-side actions for handling step media.
 */

module.exports = {

  /**
   * POST /api/media
   * Attach media (image/video/pdf) to a step.
   */
  create: async function (req, res) {
    try {
      const { stepId, type, url, title } = req.body;

      if (!stepId || !type || !url) {
        return res.status(400).json({ message: 'Step ID, type, and url are required' });
      }

      // Verify step exists and check tenant isolation
      const step = await Step.findOne({ id: stepId }).populate('guide');
      if (!step) {
        return res.status(404).json({ message: 'Step not found' });
      }

      const guide = await Guide.findOne({ id: step.guide.id || step.guide }).populate('product');
      if (req.user && req.user.companyId && String(guide.product.company) !== String(req.user.companyId)) {
        return res.status(403).json({ message: 'Forbidden: Step does not belong to your company' });
      }

      const media = await Media.create({
        step: stepId,
        type,
        url,
        title
      }).fetch();

      return res.status(201).json(media);

    } catch (err) {
      sails.log.error('Create media error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

};
