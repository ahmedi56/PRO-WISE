/**
 * verify-recommendations.js
 * 
 * Diagnostic script to verify the AI recommendation pipeline.
 * Usage: sails run scripts/verify-recommendations.js
 */

module.exports = {
  friendlyName: 'Verify recommendations',
  description: 'Checks semantic similarity and component-based links between products.',

  fn: async function () {
    sails.log('Starting recommendation diagnostic...');

    // in sails scripts, the models are loaded onto sails.models
    const products = await sails.models.product.find({ status: 'published' }).populate('category');
    
    if (products.length === 0) {
       sails.log.warn('No published products found in the database. Run bootstrap or seed first.');
       return;
    }

    sails.log(`\nFound ${products.length} published products.\n`);

    for (const product of products) {
      sails.log('-------------------------------------------------------------');
      
      let embeddingStatus = product.embedding ? `OK (${product.embedding.length} dims)` : 'NULL';
      sails.log(`Product: [${product.id}] ${product.name}`);
      sails.log(`Category: ${product.category?.name || 'None'}`);
      sails.log(`Embedding: ${embeddingStatus}`);

      try {
        const recommendations = await sails.helpers.getSimilarityRecommendations.with({
          productId: product.id,
          limit: 3
        });

        sails.log(`\nTop Recommendations for ${product.name}:`);
        if (recommendations.length === 0) {
           sails.log.warn('  -> No recommendations returned.');
        } else {
           recommendations.forEach((r, idx) => {
             const score = (r.score * 100).toFixed(1) + '%';
             // Format reason length to align output
             const paddedReason = (r.recommendationReason || 'Similar').padEnd(35, ' ');
             sails.log(`  ${idx + 1}. [${score}] ${paddedReason} | ${r.name}`);
           });
        }
      } catch (err) {
        sails.log.error(`Error getting recommendations for ${product.name}:`, err.message);
      }
      
      sails.log('-------------------------------------------------------------\n');
    }

    sails.log('Diagnostic sequence complete.');
  }
};
