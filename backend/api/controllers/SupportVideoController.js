/**
 * SupportVideoController
 *
 * @description :: Server-side actions for handling support videos.
 */
const path = require('path');
const fs = require('fs');
const os = require('os');

const getDesktopDocsPath = () => {
  if (os.platform() === 'win32') {
    return 'C:\\Users\\T560\\Desktop\\Pro-wise cont';
  }
  const fallbackPath = path.join(os.homedir(), 'Desktop', 'Pro-wise cont');
  try {
    if (!fs.existsSync(fallbackPath)) {
      fs.mkdirSync(fallbackPath, { recursive: true });
    }
    return fallbackPath;
  } catch (e) {
    return path.join(process.cwd(), '.tmp', 'uploads');
  }
};
const DESKTOP_DOCS_PATH = getDesktopDocsPath();

module.exports = {

  /**
   * POST /api/support/videos/upload
   * Save Video directly to the desktop folder
   */
  upload: async function (req, res) {
    try {
      if (!fs.existsSync(DESKTOP_DOCS_PATH)) {
        fs.mkdirSync(DESKTOP_DOCS_PATH, { recursive: true });
      }

      req.file('video').upload({
        dirname: DESKTOP_DOCS_PATH,
        maxBytes: 150000000, // 150MB limit
        saveAs: function(file, cb) {
          const allowedExts = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
          const ext = path.extname(file.filename).toLowerCase();
          if (!allowedExts.includes(ext)) {
            return cb(new Error('Only video files are allowed (MP4, MOV, AVI, MKV, WebM).'));
          }
          const safeName = Date.now() + '-' + file.filename.replace(/[^a-zA-Z0-9.-]/g, '-').toLowerCase();
          cb(null, safeName);
        }
      }, function (err, uploadedFiles) {
        if (err) {
          sails.log.error('Video Desktop Upload Error:', err);
          return res.status(500).json({ message: 'Desktop upload error: ' + (err.message || 'Unknown error') });
        }

        if (!uploadedFiles || uploadedFiles.length === 0) {
          return res.status(400).json({ message: 'No file was received. Please ensure you selected a valid video.' });
        }

        const file = uploadedFiles[0];
        const filename = path.basename(file.fd);
        const fileUrl = `/api/support/videos/view/${filename}`;

        sails.log.info('Video saved to desktop:', filename);
        return res.json({
          message: 'Video saved to desktop folder successfully',
          fileUrl: fileUrl,
          filename: filename
        });
      });
    } catch (err) {
      sails.log.error('Video Upload Controller Error:', err);
      return res.status(500).json({ message: err.message });
    }
  },

  /**
   * GET /api/support/videos/view/:filename
   * Stream video with range-request support for mobile/safari seeking
   */
  view: async function (req, res) {
    try {
      const filename = req.params.filename;
      if (!filename) {
        return res.status(400).send('Filename is required');
      }

      const filePath = path.join(DESKTOP_DOCS_PATH, filename);
      const absolutePath = path.resolve(filePath);
      if (!absolutePath.startsWith(path.resolve(DESKTOP_DOCS_PATH))) {
        return res.status(403).send('Forbidden: Access denied.');
      }

      if (!fs.existsSync(filePath)) {
        return res.status(404).send('Video not found.');
      }

      const ext = path.extname(filename).toLowerCase();
      let contentType = 'video/mp4';
      if (ext === '.webm') contentType = 'video/webm';
      else if (ext === '.mov') contentType = 'video/quicktime';
      else if (ext === '.avi') contentType = 'video/x-msvideo';

      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        
        res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Length', chunksize);
        res.setHeader('Content-Type', contentType);
        res.status(206);

        const readStream = fs.createReadStream(filePath, { start, end });
        readStream.on('error', (err) => {
          sails.log.error('Video stream range read error:', err);
        });
        readStream.pipe(res);
      } else {
        res.setHeader('Content-Length', fileSize);
        res.setHeader('Content-Type', contentType);
        res.status(200);

        const readStream = fs.createReadStream(filePath);
        readStream.on('error', (err) => {
          sails.log.error('Video stream read error:', err);
        });
        readStream.pipe(res);
      }
    } catch (err) {
      sails.log.error('Video Streaming Error:', err);
      return res.status(500).send('Error streaming video.');
    }
  },

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

      const responseVideo = Object.assign({}, newVideo);
      if (responseVideo.videoUrl) {
        responseVideo.videoUrl = TranslationService.getAbsoluteUrl(req, responseVideo.videoUrl);
      }

      return res.status(201).json(responseVideo);
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
        videoUrl: v.videoUrl ? TranslationService.getAbsoluteUrl(req, v.videoUrl) : '',
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
