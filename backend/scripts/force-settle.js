/**
 * force-settle.js
 * 
 * Manually lifts Sails to ensure ORM and Services are fully available, 
 * then forces a BGE v1.5 embedding backfill.
 */

const sails = require('sails');

sails.lift({
  hooks: { grunt: false },
  log: { level: 'info' }
}, async (err) => {
  if (err) {
    console.error('Failed to lift Sails:', err);
    process.exit(1);
  }

  try {
    console.log('--- Starting AI Model Settlement (Trake7) ---');
    
    // 1. Resolve entities
    const ProductModel = sails.models.product;
    const ProductEmbeddingService = sails.services.productembeddingservice;
    const SearchService = sails.services.searchservice;

    if (!ProductModel || !ProductEmbeddingService || !SearchService) {
      console.error('CRITICAL: Models or Services not found after lift.');
      process.exit(1);
    }

    // 2. Health Check
    console.log('Verifying Search Service health...');
    const isHealthy = await SearchService.checkHealth();
    if (!isHealthy) {
       console.error('CRITICAL: Search Service (Flask) is not reachable on port 5001.');
       process.exit(1);
    }
    console.log('[✓] Search Service is UP.');

    // 3. Fetch ALL products
    const products = await ProductModel.find({});
    console.log(`Found ${products.length} products to process.`);

    let successCount = 0;
    let failCount = 0;

    // 4. Backfill loop
    for (const p of products) {
      process.stdout.write(`Processing [${p.id}] ${p.name}... `);
      try {
        const success = await ProductEmbeddingService.updateEmbedding(p.id);
        if (success) {
          successCount++;
          console.log('[✓] OK');
        } else {
          failCount++;
          console.log('[✗] FAIL (Service Error)');
        }
      } catch (err) {
        failCount++;
        console.log(`[!] ERROR: ${err.message}`);
      }
    }

    console.log('\n--- Settlement Summary ---');
    console.log(`Total:     ${products.length}`);
    console.log(`Success:   ${successCount}`);
    console.log(`Fail:      ${failCount}`);

    sails.lower(() => {
      process.exit(failCount === 0 ? 0 : 1);
    });

  } catch (err) {
    console.error('Unexpected script error:', err);
    sails.lower(() => process.exit(1));
  }
});
