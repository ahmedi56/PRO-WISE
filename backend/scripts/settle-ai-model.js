/**
 * settle-ai-model.js
 * 
 * Finalizes the AI model upgrade by forcing a complete backfill of all product 
 * embeddings to use the new BAAI/bge-small-en-v1.5 standard.
 */

module.exports = {
  friendlyName: 'Settle AI Model',
  description: 'Re-calculates all product embeddings using the BGE v1.5 standard.',

  fn: async function() {
    sails.log.info('--- Starting AI Model Settlement (Trake7) ---');
    
    // Diagnostic log
    sails.log.info('Environment Check:');
    sails.log.info(`- sails.services available: ${!!sails.services} (Keys: ${Object.keys(sails.services || {}).join(', ')})`);
    sails.log.info(`- sails.models available: ${!!sails.models} (Keys: ${Object.keys(sails.models || {}).join(', ')})`);
    
    // Resolve Services 
    // Sails usually lowercases service keys
    const _SearchService = sails.services.searchservice;
    const _ProductEmbeddingService = sails.services.productembeddingservice;
    const ProductModel = sails.models.product;
    
    if (!_SearchService || !_ProductEmbeddingService || !ProductModel) {
      sails.log.error('Required entities missing. Attempting manual load from absolute paths...');
      try {
         // Manual require as fallback if sails loader didn't populate them yet
         const sS = require('../api/services/SearchService');
         const pES = require('../api/services/ProductEmbeddingService');
         
         // Bind sails if needed (not standard but sometimes helpful)
         // We'll just run them if they are objects with methods
         const manualSuccess = typeof sS.checkHealth === 'function' && typeof pES.updateEmbedding === 'function';
         
         if (manualSuccess) {
            sails.log.info('Manual service load logic triggered.');
            // We proceed using these local references
            await runSettlement(sS, pES, ProductModel);
         } else {
            sails.log.error('Manual load failed: functions not found on exported objects.');
         }
      } catch (e) {
         sails.log.error('Manual service load failed: ' + e.message);
         return;
      }
    } else {
      await runSettlement(_SearchService, _ProductEmbeddingService, ProductModel);
    }

    async function runSettlement(ss, pes, model) {
      // 1. Health Check
      sails.log.info('Verifying Search Service health...');
      const isHealthy = await ss.checkHealth();
      if (!isHealthy) {
        sails.log.error('CRITICAL: Search Service (Flask) is not reachable on port 5001.');
        return;
      }
      sails.log.info('[✓] Search Service is UP and healthy.');

      // 2. Fetch all products
      const products = await model.find({}).populate('category').populate('company');
      sails.log.info(`Found ${products.length} products to process.`);

      let successCount = 0;
      let failCount = 0;

      // 3. Process each product
      for (const product of products) {
        sails.log.info(`Processing [${product.id}] ${product.name}...`);
        
        try {
          const success = await pes.updateEmbedding(product.id);
          if (success) {
            successCount++;
            sails.log.info(`  [✓] Updated successfully.`);
          } else {
            failCount++;
            sails.log.error(`  [✗] Failed to generate/save embedding.`);
          }
        } catch (err) {
          failCount++;
          sails.log.error(`  [!] Error processing product: ${err.message}`);
        }
      }

      sails.log.info('--- Settlement Summary ---');
      sails.log.info(`Total Products: ${products.length}`);
      sails.log.info(`Successes:      ${successCount}`);
      sails.log.info(`Failures:       ${failCount}`);
      
      if (failCount === 0) {
        sails.log.info('AI Model Settlement completed PERFECTLY.');
      } else {
        sails.log.warn('AI Model Settlement completed with some errors.');
      }
    }
  }
};
