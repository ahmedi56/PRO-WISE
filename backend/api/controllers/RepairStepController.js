/**
 * RepairStepController
 *
 * @description :: Server-side actions for handling steps within a repair guide.
 */

module.exports = {

  /**
   * POST /api/support/steps
   * Admin-only Create Repair Step
   * Business rule: Prevents duplicate stepNumber per guide.
   */
  create: async function (req, res) {
    try {
      const { guide, step_number, images, videos, pdfs, estimated_time, translations } = req.body;

      if (!guide || !step_number) {
        return res.status(400).json({ message: 'Guide ID and step number are required.' });
      }

      // Check for duplicate step number
      const existingStep = await RepairStep.findOne({ guide, stepNumber: step_number });
      if (existingStep) {
        return res.status(400).json({ message: `Step number ${step_number} already exists for this guide.` });
      }

      // Improve: Extract video IDs if full URLs are provided
      const processedVideos = (videos || []).map(v => TranslationService.extractVideoId(v));

      const newStep = await RepairStep.create({
        guide,
        stepNumber: step_number,
        images, // Supports both strings and objects {url, caption}
        videos: processedVideos,
        pdfs: pdfs || [],
        estimatedTime: estimated_time,
        translations
      }).fetch();

      return res.status(201).json(newStep);
    } catch (err) {
      return res.serverError(err);
    }
  },

  /**
   * GET /api/support/steps/guide/:guideId?lang=en
   * Fetch all steps for a guide, sorted by step number.
   */
  getByGuide: async function (req, res) {
    try {
      const guideId = req.params.guideId;
      const lang = req.query.lang || 'en';

      const steps = await RepairStep.find({ guide: guideId }).sort('stepNumber ASC');

      const processedSteps = steps.map(step => {
        const stepTrans = TranslationService.translate(step, lang, ['title', 'description']);
        return {
          id: step.id,
          step_number: step.stepNumber,
          images: step.images || [],
          videos: step.videos || [],
          pdfs: step.pdfs || [],
          estimated_time: step.estimatedTime,
          title: stepTrans.title,
          description: stepTrans.description
        };
      });

      return res.json(processedSteps);
    } catch (err) {
      return res.serverError(err);
    }
  },

  /**
   * PUT /api/support/steps/:id
   * Admin-only Update Step
   */
  update: async function (req, res) {
    try {
      const id = req.params.id;
      const { step_number, images, videos, pdfs, estimated_time, translations } = req.body;

      const existing = await RepairStep.findOne({ id });
      if (!existing) {
        return res.status(404).json({ message: 'Repair Step not found' });
      }

      // Conflict validation for step number
      if (step_number && step_number !== existing.stepNumber) {
        const conflict = await RepairStep.findOne({ guide: existing.guide, stepNumber: step_number });
        if (conflict) {
          return res.status(400).json({ message: `Step number ${step_number} already exists for this guide.` });
        }
      }

      // Extract video IDs
      const processedVideos = videos ? videos.map(v => TranslationService.extractVideoId(v)) : undefined;

      const updated = await RepairStep.updateOne({ id }).set({
        stepNumber: step_number,
        images,
        videos: processedVideos,
        pdfs: pdfs,
        estimatedTime: estimated_time,
        translations
      });

      return res.json(updated);
    } catch (err) {
      return res.serverError(err);
    }
  },

  /**
   * DELETE /api/support/steps/:id
   */
  delete: async function (req, res) {
    try {
      const id = req.params.id;
      const removed = await RepairStep.destroyOne({ id });
      if (!removed) {
        return res.status(404).json({ message: 'Repair Step not found' });
      }

      return res.json({ message: 'Repair Step successfully removed.' });
    } catch (err) {
      return res.serverError(err);
    }
  }

};
