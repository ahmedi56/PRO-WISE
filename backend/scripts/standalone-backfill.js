/**
 * standalone-backfill.js
 * 
 * Usage: node scripts/standalone-backfill.js
 * 
 * A robust standalone script that manually loads the Sails environment
 * to ensure all models and services are available, then runs the backfill.
 */

const sails = require('sails');
require('dotenv').config();

console.log('--- Initializing Sails for Standalone Backfill ---');

sails.load({
  hooks: {
    // Only load necessary hooks for speed and reliability in CLI
    grunt: false,
    views: false,
    sockets: require('sails-hook-sockets'),
    orm: require('sails-hook-orm')
  },
  log: { level: 'info' }
}, async (err) => {
  if (err) {
    console.error('Failed to load Sails:', err);
    process.exit(1);
  }

  try {
    console.log('=== Starting Standalone Embedding Backfill ===');
    
    const provider = (process.env.AI_PROVIDER || 'google').toLowerCase();
    const hasKey = !!process.env.GOOGLE_AI_API_KEY;

    console.log(`Target Provider: ${provider.toUpperCase()}`);
    if (!hasKey) {
      console.error('CRITICAL: GOOGLE_AI_API_KEY is missing in .env');
      sails.lower();
      process.exit(1);
    }

    const ProductModel = sails.models.product;
    if (!ProductModel) {
      console.error('CRITICAL: Product model not found after load.');
      sails.lower();
      process.exit(1);
    }

    // 1. Fetch all products
    const products = await ProductModel.find({}).populate('category').populate('company');
    console.log(`Found ${products.length} products to process.`);

    let successCount = 0;
    let failCount = 0;

    // 2. Process each product
    for (const product of products) {
      process.stdout.write(`Processing: ${product.name}... `);
      
      try {
        const success = await sails.services.productembeddingservice.updateEmbedding(product.id);
        if (success) {
          successCount++;
          console.log('[✓]');
        } else {
          failCount++;
          console.log('[✗]');
        }
      } catch (err) {
        failCount++;
        console.log(`[!] Error: ${err.message}`);
      }
    }

    console.log('\n--- Backfill Summary ---');
    console.log(`Total:   ${products.length}`);
    console.log(`Success: ${successCount}`);
    console.log(`Fail:    ${failCount}`);
    console.log('======================================');

    sails.lower(() => process.exit(0));
  } catch (err) {
    console.error('Unexpected Error:', err);
    sails.lower(() => process.exit(1));
  }
});
