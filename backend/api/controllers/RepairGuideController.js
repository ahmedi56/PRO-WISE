/**
 * RepairGuideController
 *
 * @description :: Server-side actions for handling repair guides.
 */

module.exports = {

  /**
   * POST /api/support/guides
   * Admin-only Create Repair Guide
   */
  create: async function (req, res) {
    try {
      const { product, difficulty, estimated_time, isPublished, translations } = req.body;
      const createdBy = req.user.id;

      if (!product) {
        return res.status(400).json({ message: 'Product ID is required' });
      }

      // Check if product exists
      const productRecord = await Product.findOne({ id: product });
      if (!productRecord) {
        return res.status(404).json({ message: 'Product not found' });
      }

      const newGuide = await RepairGuide.create({
        product,
        createdBy,
        difficulty,
        estimatedTime: estimated_time,
        isPublished,
        translations
      }).fetch();

      return res.status(201).json(newGuide);
    } catch (err) {
      return res.serverError(err);
    }
  },

  /**
   * GET /api/support/guides/:id?lang=en
   * Fetch a specific guide with steps
   */
  getOne: async function (req, res) {
    try {
      const id = req.params.id;
      const lang = req.query.lang || 'en';

      const guide = await RepairGuide.findOne({ id })
        .populate('createdBy')
        .populate('steps', {
          sort: 'stepNumber ASC'
        });

      if (!guide) {
        return res.status(404).json({ message: 'Repair Guide not found' });
      }

      // Use Translation Service
      const guideTrans = TranslationService.translate(guide, lang, ['title', 'description']);
      const processedSteps = guide.steps.map(step => {
        const stepTrans = TranslationService.translate(step, lang, ['title', 'description']);
        return {
          id: step.id,
          step_number: step.stepNumber,
          images: step.images || [],
          videos: step.videos || [],
          estimated_time: step.estimatedTime,
          title: stepTrans.title,
          description: stepTrans.description
        };
      });

      return res.json({
        id: guide.id,
        product: guide.product,
        difficulty: guide.difficulty,
        estimated_time: guide.estimatedTime,
        isPublished: guide.isPublished,
        title: guideTrans.title,
        description: guideTrans.description,
        author: guide.createdBy ? guide.createdBy.name : 'Unknown',
        steps: processedSteps
      });

    } catch (err) {
      return res.serverError(err);
    }
  },

  /**
   * DELETE /api/support/guides/:id
   * Remove a guide and its steps
   */
  delete: async function (req, res) {
    try {
      const id = req.params.id;
      
      // Delete steps first
      await RepairStep.destroy({ guide: id });
      
      const removed = await RepairGuide.destroyOne({ id });
      if (!removed) {
        return res.status(404).json({ message: 'Repair Guide not found' });
      }

      return res.json({ message: 'Repair Guide and related steps successfully removed.' });
    } catch (err) {
      return res.serverError(err);
    }
  }

};
