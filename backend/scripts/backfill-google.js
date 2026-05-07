/**
 * backfill-google.js
 * 
 * Usage: npx sails run backfill-google
 * 
 * Purpose: Directly updates all product embeddings using the configured AI provider.
 * Since this runs as a Sails shell script, it has direct access to models and 
 * services and does not require HTTP authentication.
 */

module.exports = {
  friendlyName: 'Backfill Google Embeddings',
  description: 'Force-updates all product embeddings via the configured AI provider (Google or Local).',

  fn: async function() {
    require('dotenv').config();
    sails.log.info('=== Starting Direct Embedding Backfill ===');
    
    const provider = (process.env.AI_PROVIDER || 'local').toLowerCase();
    const hasKey = !!process.env.GOOGLE_AI_API_KEY;

    sails.log.info(`Target Provider: ${provider.toUpperCase()}`);
    if (provider === 'google' && !hasKey) {
      sails.log.error('CRITICAL: AI_PROVIDER is set to "google" but GOOGLE_AI_API_KEY is missing in .env');
      return;
    }

    // 1. Resolve Models & Services Safely
    const ProductModel = (sails.models && sails.models.product) ? sails.models.product : (typeof Product !== 'undefined' ? Product : null);
    const EmbeddingService = (sails.services && sails.services.productembeddingservice) ? sails.services.productembeddingservice : null;

    if (!ProductModel) {
      sails.log.error('CRITICAL: Product model is not loaded. Try running this script while the app is stopped.');
      return;
    }
    
    const products = await ProductModel.find({}).populate('category').populate('company');
    sails.log.info(`Found ${products.length} products to process.`);

    let successCount = 0;
    let failCount = 0;

    // 2. Process each product
    for (const product of products) {
      sails.log.info(`Processing: [${product.id}] ${product.name}...`);
      
      try {
        // This service call now automatically uses Gemini if configured
        const success = await sails.services.productembeddingservice.updateEmbedding(product.id);
        if (success) {
          successCount++;
          sails.log.info('  [✓] Success');
        } else {
          failCount++;
          sails.log.error('  [✗] Service returned false (check Gemini API key/limits)');
        }
      } catch (err) {
        failCount++;
        sails.log.error(`  [!] Error: ${err.message}`);
      }
    }

    sails.log.info('\n--- Backfill Summary ---');
    sails.log.info(`Total:   ${products.length}`);
    sails.log.info(`Success: ${successCount}`);
    sails.log.info(`Fail:    ${failCount}`);
    sails.log.info('======================================');
  }
};
