/**
 * SupportPDFController
 *
 * @description :: Server-side actions for handling support PDF uploads and serving.
 *                 Uses a portable upload directory that works on both local dev and Render.
 */
const path = require('path');
const fs = require('fs');
const os = require('os');

// Portable upload directory: use env var, or fallback to OS temp dir
const UPLOADS_PATH = process.env.PROWISE_UPLOADS_PATH
  || path.join(os.tmpdir(), 'prowise-uploads', 'pdfs');

/**
 * Build the public base URL for this backend instance.
 * On Render: uses RENDER_EXTERNAL_URL env var.
 * Locally: uses req.protocol + req.get('host').
 */
function getBaseUrl(req) {
  if (process.env.RENDER_EXTERNAL_URL) {
    return process.env.RENDER_EXTERNAL_URL;
  }
  // Fallback: build from request
  const protocol = req.protocol || 'http';
  const host = req.get('host') || req.headers.host || 'localhost:1337';
  return `${protocol}://${host}`;
}

/**
 * Normalize a fileUrl to an absolute public URL.
 * - If already absolute (http/https), return as-is.
 * - If relative (starts with /), prepend the backend base URL.
 */
function normalizeFileUrl(fileUrl, req) {
  if (!fileUrl) return null;
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }
  const baseUrl = getBaseUrl(req);
  // Ensure the relative path includes /api prefix
  const apiPath = fileUrl.startsWith('/api/') ? fileUrl : `/api${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
  return `${baseUrl}${apiPath}`;
}

module.exports = {

  // Export normalizeFileUrl for use by other controllers
  _normalizeFileUrl: normalizeFileUrl,

  /**
   * POST /api/support/pdfs/upload
   * Upload a PDF file to the server's portable storage directory.
   */
  upload: async function (req, res) {
    try {
      // Ensure the upload directory exists
      if (!fs.existsSync(UPLOADS_PATH)) {
        fs.mkdirSync(UPLOADS_PATH, { recursive: true });
      }

      req.file('pdf').upload({
        dirname: UPLOADS_PATH,
        maxBytes: 50000000, // 50MB limit
        saveAs: function(file, cb) {
          // Strictly enforce PDF extension
          if (file.filename && !file.filename.toLowerCase().endsWith('.pdf')) {
            return cb(new Error('Only PDF files are allowed.'));
          }
          const safeName = Date.now() + '-' + file.filename.replace(/[^a-zA-Z0-9.-]/g, '-').toLowerCase();
          cb(null, safeName);
        }
      }, function (err, uploadedFiles) {
        if (err) {
          sails.log.error('PDF Upload Error:', err);
          return res.status(500).json({ message: 'Upload error: ' + (err.message || 'Unknown error') });
        }

        if (!uploadedFiles || uploadedFiles.length === 0) {
          return res.status(400).json({ message: 'No file was received. Please ensure you selected a valid PDF.' });
        }

        const file = uploadedFiles[0];

        // Warn on MIME type mismatch (Skipper may not always populate correctly)
        if (file.type && file.type !== 'application/pdf') {
          sails.log.warn('Uploaded file type mismatch:', file.type);
        }

        const filename = path.basename(file.fd);

        // Build absolute public URL so mobile/web clients can use it directly
        const baseUrl = getBaseUrl(req);
        const fileUrl = `${baseUrl}/api/support/pdfs/view/${filename}`;

        sails.log.info('PDF uploaded successfully:', filename);
        return res.json({
          message: 'File uploaded successfully',
          fileUrl: fileUrl,
          filename: filename
        });
      });
    } catch (err) {
      sails.log.error('PDF Upload Controller Error:', err);
      return res.status(500).json({ message: err.message });
    }
  },

  /**
   * GET /api/support/pdfs/view/:filename
   * Stream a PDF from the upload directory.
   */
  view: async function (req, res) {
    try {
      const filename = req.params.filename;
      if (!filename) {
        return res.status(400).send('Filename is required');
      }

      const filePath = path.join(UPLOADS_PATH, filename);

      // Security check: prevent path traversal
      const absolutePath = path.resolve(filePath);
      if (!absolutePath.startsWith(path.resolve(UPLOADS_PATH))) {
        return res.status(403).send('Forbidden: Access denied.');
      }

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ 
          message: 'Document not found. Files on Render are ephemeral and may be lost after redeploy. Consider using external URLs or cloud storage for persistent files.'
        });
      }

      // Set correct content type for PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="' + filename.replace(/"/g, '') + '"');
      // Allow cross-origin access for mobile
      res.setHeader('Access-Control-Allow-Origin', '*');

      // Stream the file
      const readStream = fs.createReadStream(filePath);
      
      readStream.on('error', (streamErr) => {
        sails.log.error('PDF Read Stream Error:', streamErr);
        if (!res.headersSent) {
          res.status(500).send('Error reading document.');
        }
      });

      readStream.pipe(res);
    } catch (err) {
      sails.log.error('PDF Streaming Error:', err);
      return res.status(500).send('Error streaming document.');
    }
  },

  /**
   * POST /api/support/pdfs
   * Create database record for the document
   */
  create: async function (req, res) {
    try {
      const { product, title, fileUrl } = req.body;
      const createdBy = req.user.id;

      if (!product || !title || !fileUrl) {
        return res.status(400).json({ message: 'Product, title, and fileUrl are required.' });
      }

      const newPDF = await SupportPDF.create({
        product,
        title,
        fileUrl,
        createdBy
      }).fetch();

      return res.status(201).json(newPDF);
    } catch (err) {
      return res.serverError(err);
    }
  },

  /**
   * GET /api/support/pdfs/:productId
   * Fetch all documents for a product (with normalized URLs)
   */
  getByProduct: async function (req, res) {
    try {
      const productId = req.params.productId;
      const pdfs = await SupportPDF.find({ product: productId }).sort('createdAt DESC');
      return res.json(pdfs.map(p => ({ 
        id: p.id, 
        title: p.title, 
        fileUrl: normalizeFileUrl(p.fileUrl, req)
      })));
    } catch (err) {
      return res.serverError(err);
    }
  },

  /**
   * DELETE /api/support/pdfs/:id
   * Remove a document record and optionally the physical file
   */
  delete: async function (req, res) {
    try {
      const id = req.params.id;
      const pdf = await SupportPDF.findOne({ id });
      
      if (!pdf) {
        return res.status(404).json({ message: 'Support document not found' });
      }

      // Try to delete the physical file if it's a local upload
      if (pdf.fileUrl && !pdf.fileUrl.startsWith('http')) {
        const filename = path.basename(pdf.fileUrl);
        const filePath = path.join(UPLOADS_PATH, filename);
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            sails.log.info('Deleted physical file:', filename);
          }
        } catch (fileErr) {
          sails.log.warn('Could not delete physical file:', fileErr.message);
        }
      }

      await SupportPDF.destroyOne({ id });

      return res.json({ message: 'Support document successfully removed.' });
    } catch (err) {
      return res.serverError(err);
    }
  }

};
