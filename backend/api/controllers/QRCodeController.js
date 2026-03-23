/**
 * QRCodeController
 *
 * @description :: Server-side actions for handling QR codes.
 */
const QRCodeLib = require('qrcode');

module.exports = {

  /**
     * POST /api/qr/generate
     *
     * @description :: Generate a QR code for a product. Restricted by qr.generate permission.
     */
  generate: async function (req, res) {
    try {
      const { productId } = req.body;
      if (!productId) {
        return res.status(400).json({ message: 'Product ID is required' });
      }

      const product = await Product.findOne({ id: productId });
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // Tenant isolation
      const userCompanyId = String(req.companyId || req.user?.companyId || '');
      const productCompanyId = String(product.company || '');

      sails.log.info(`QR Generation attempt for product ${product.id}. User Company: ${userCompanyId}, Product Company: ${productCompanyId}`);

      if (userCompanyId && productCompanyId && productCompanyId !== userCompanyId) {
        return res.status(403).json({ 
          message: 'Forbidden: Product does not belong to your company',
          debug: { userCompanyId, productCompanyId }
        });
      }

      // Generate a public URL for the product detail page
      const baseUrl = (sails.config.custom.frontendUrl || 'http://localhost:5173').replace(/\/+$/, '');
      const url = `${baseUrl}/products/${product.id}`;

      // Generate QR code as Data URL
      const qrDataUrl = await QRCodeLib.toDataURL(url, {
        color: {
          dark: '#1e1e1e',
          light: '#ffffff'
        },
        width: 400,
        margin: 2
      });

      // Save the QR code record if not exists
      let qrRecord = await QRCode.findOne({ product: product.id });
      if (!qrRecord) {
        qrRecord = await QRCode.create({
          product: product.id,
          code: product.id // Just use ID as code for now
        }).fetch();
      }

      // 8. Store QR URL directly in Product for modular refactor
      await Product.updateOne({ id: product.id }).set({ qrCodeUrl: qrDataUrl });

      return res.json({
        success: true,
        qrDataUrl,
        product: {
          id: product.id,
          name: product.name
        }
      });

    } catch (err) {
      sails.log.error('QR generation error:', err);
      return res.status(500).json({ 
        message: 'Internal server error', 
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }
  }

};
