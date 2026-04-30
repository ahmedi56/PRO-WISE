/**
 * SupportVideoController
 *
 * @description :: Server-side actions for handling support videos.
 */

module.exports = {

  /**
   * POST /api/support/videos
   * Admin-only Create Video
   * Improved: Now automatically extracts videoId from full YouTube URLs.
   */
  create: async function (req, res) {
    try {
      let { product, videoId, videoUrl, title } = req.body;
      const createdBy = req.user.id;

      if (!product || (!videoId && !videoUrl) || !title) {
        return res.status(400).json({ message: 'Product, (videoId or videoUrl), and title are required.' });
      }

      // Robust extraction of videoId if provided
      const cleanVideoId = videoId ? TranslationService.extractVideoId(videoId) : '';

      const newVideo = await SupportVideo.create({
        product,
        videoId: cleanVideoId,
        videoUrl: videoUrl || '',
        title,
        createdBy
      }).fetch();

      return res.status(201).json(newVideo);
    } catch (err) {
      return res.serverError(err);
    }
  },

  /**
   * GET /api/support/videos/:productId
   * Fetch all videos for a product
   */
  getByProduct: async function (req, res) {
    try {
      const productId = req.params.productId;
      const videos = await SupportVideo.find({ product: productId }).populate('createdBy');
      
      return res.json(videos.map(v => ({ 
        id: v.id, 
        videoId: v.videoId, 
        videoUrl: v.videoUrl,
        title: v.title,
        author: v.createdBy ? v.createdBy.name : 'Unknown'
      })));
    } catch (err) {
      return res.serverError(err);
    }
  },

  /**
   * DELETE /api/support/videos/:id
   */
  delete: async function (req, res) {
    try {
      const id = req.params.id;
      const removed = await SupportVideo.destroyOne({ id });
      if (!removed) {
        return res.status(404).json({ message: 'Support Video not found' });
      }

      return res.json({ message: 'Support Video successfully removed.' });
    } catch (err) {
      return res.serverError(err);
    }
  }

};
