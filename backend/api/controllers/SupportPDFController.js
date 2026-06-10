/**
 * SupportPDFController
 *
 * @description :: Server-side actions for handling support PDFs on the desktop folder.
 */
const path = require('path');
const fs = require('fs');

const DESKTOP_DOCS_PATH = 'C:\\Users\\T560\\Desktop\\Pro-wise cont';

module.exports = {

  /**
   * POST /api/support/pdfs/upload
   * Save PDF directly to the desktop folder
   */
  upload: async function (req, res) {
    try {
      // Ensure the desktop directory exists
      if (!fs.existsSync(DESKTOP_DOCS_PATH)) {
        fs.mkdirSync(DESKTOP_DOCS_PATH, { recursive: true });
      }

      req.file('pdf').upload({
        dirname: DESKTOP_DOCS_PATH,
        maxBytes: 50000000, // 50MB limit
        saveAs: function(file, cb) {
          // Strictly enforce PDF extension and MIME type
          if (file.filename && !file.filename.toLowerCase().endsWith('.pdf')) {
            return cb(new Error('Only PDF files are allowed.'));
          }
          const safeName = Date.now() + '-' + file.filename.replace(/[^a-zA-Z0-9.-]/g, '-').toLowerCase();
          cb(null, safeName);
        }
      }, function (err, uploadedFiles) {
        if (err) {
          sails.log.error('PDF Desktop Upload Error:', err);
          return res.status(500).json({ message: 'Desktop upload error: ' + (err.message || 'Unknown error') });
        }

        if (!uploadedFiles || uploadedFiles.length === 0) {
          return res.status(400).json({ message: 'No file was received. Please ensure you selected a valid PDF.' });
        }

        const file = uploadedFiles[0];
        
        // Double check MIME type if available from the upload stream
        if (file.type && file.type !== 'application/pdf') {
          // Note: Skipper might not always populate 'type' correctly depending on adapter, 
          // but we already checked the extension in saveAs.
          sails.log.warn('Uploaded file type mismatch:', file.type);
        }

        const filename = path.basename(file.fd);
        // The frontend uses API_URL which already includes '/api'
        // Using a leading slash ensures consistent concatenation
        const fileUrl = `/support/pdfs/view/${filename}`;

        sails.log.info('PDF saved to desktop:', filename);
        return res.json({
          message: 'File saved to desktop folder successfully',
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
   * Stream a PDF directly from the desktop folder
   */
  view: async function (req, res) {
    try {
      const filename = req.params.filename;
      if (!filename) {
        return res.status(400).send('Filename is required');
      }

      const filePath = path.join(DESKTOP_DOCS_PATH, filename);

      // Security check: Ensure we are only reading from the intended directory
      const absolutePath = path.resolve(filePath);
      if (!absolutePath.startsWith(path.resolve(DESKTOP_DOCS_PATH))) {
        return res.status(403).send('Forbidden: Access denied outside of support docs.');
      }

      if (!fs.existsSync(filePath)) {
        return res.status(404).send('Document not found on desktop.');
      }

      // Set correct content type for PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="' + filename.replace(/"/g, '') + '"');

      // Stream the file for high performance
      const readStream = fs.createReadStream(filePath);
      
      // Handle stream errors
      readStream.on('error', (streamErr) => {
        sails.log.error('PDF Read Stream Error:', streamErr);
        if (!res.headersSent) {
          res.status(500).send('Error reading document from storage.');
        }
      });

      readStream.pipe(res);
    } catch (err) {
      sails.log.error('PDF Streaming Error:', err);
      return res.status(500).send('Error streaming document from desktop.');
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
   * Fetch all documents for a product
   */
  getByProduct: async function (req, res) {
    try {
      const productId = req.params.productId;
      const pdfs = await SupportPDF.find({ product: productId }).sort('createdAt DESC');
      return res.json(pdfs.map(p => ({ id: p.id, title: p.title, fileUrl: p.fileUrl })));
    } catch (err) {
      return res.serverError(err);
    }
  },

  /**
   * DELETE /api/support/pdfs/:id
   * Remove a document
   */
  delete: async function (req, res) {
    try {
      const id = req.params.id;
      const pdf = await SupportPDF.findOne({ id });
      
      if (!pdf) {
        return res.status(404).json({ message: 'Support document not found' });
      }

      // Optionally delete the physical file too, but we will leave it for now for safety
      await SupportPDF.destroyOne({ id });

      return res.json({ message: 'Support document successfully removed.' });
    } catch (err) {
      return res.serverError(err);
    }
  }

};
