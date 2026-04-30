/**
 * SupportController
 *
 * @description :: Server-side actions for handling support content aggregation.
 */

module.exports = {

  /**
   * GET /api/support/products/:productId
   * Returns aggregated support content (videos, pdfs, steps) for a product.
   * Improved: Now includes guide metadata and unified translations.
   */
  getProductSupport: async function (req, res) {
    try {
      const productId = req.params.productId;
      const lang = req.query.lang || 'en';

      if (!productId) {
        return res.status(400).json({ message: 'Product ID is required' });
      }

      const manage = req.query.manage === 'true';
      const criteria = { product: productId };
      if (!manage) {
        criteria.isPublished = true;
      }

      // 1. Fetch Repair Guide
      const guide = await RepairGuide.findOne(criteria)
      .populate('createdBy')
      .populate('steps', {
        sort: 'stepNumber ASC'
      });

      // 2. Fetch Videos
      const videos = await SupportVideo.find({ product: productId }).populate('createdBy');

      // 3. Fetch PDFs
      const pdfs = await SupportPDF.find({ product: productId }).populate('createdBy');

      // 4. Process Translations and Structure
      let guideMeta = null;
      let steps = [];

      if (guide) {
        const guideTrans = TranslationService.translate(guide, lang, ['title', 'description']);
        guideMeta = {
          id: guide.id,
          difficulty: guide.difficulty,
          estimated_time: guide.estimatedTime,
          title: guideTrans.title,
          description: guideTrans.description,
          author: guide.createdBy ? guide.createdBy.name : 'Unknown'
        };

        if (guide.steps) {
          steps = guide.steps.map(step => {
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
        }
      }

      return res.json({
        guide: guideMeta,
        videos: videos.map(v => ({ 
          id: v.id, 
          videoId: v.videoId, 
          title: v.title, 
          author: v.createdBy ? v.createdBy.name : 'Unknown' 
        })),
        pdfs: pdfs.map(p => ({ 
          id: p.id, 
          title: p.title, 
          fileUrl: p.fileUrl, 
          author: p.createdBy ? p.createdBy.name : 'Unknown' 
        })),
        steps: steps
      });

    } catch (err) {
      return res.serverError(err);
    }
  }

};
