/**
 * populate-embeddings.js
 * 
 * Usage: sails run scripts/populate-embeddings.js
 */

module.exports = {
  friendlyName: 'Populate embeddings',
  description: 'Generate embeddings for all existing products that lack them.',

  fn: async function () {
    sails.log('Starting embedding population...');

    // Ensure service is ready before starting
    const serviceReady = await sails.services.searchservice.ensureServiceReady();
    if (!serviceReady) {
      sails.log.error('ABORTING: Embedding service is not available.');
      return;
    }

    // Find products that either have no embedding or no search document
    const ProductModel = typeof Product !== 'undefined' ? Product : (sails.models ? sails.models.product : null);
    if (!ProductModel) {
      sails.log.error('ABORTING: Product model not found.');
      return;
    }

    const products = await ProductModel.find({
      or: [
        { embedding: null },
        { searchDocument: null }
      ]
    });
    
    sails.log(`Found ${products.length} products needing embedding/document updates.`);

    let successCount = 0;
    let failCount = 0;

    for (let product of products) {
      try {
        sails.log(`Processing product: ${product.name}`);
        // Use the service which handles rich document building and now returns boolean success
        const success = await sails.services.productembeddingservice.updateEmbedding(product.id);
        
        if (success) {
          sails.log.info(`Successfully updated embedding for: ${product.name}`);
          successCount++;
        } else {
          sails.log.warn(`Failed to update embedding for: ${product.name}`);
          failCount++;
        }
      } catch (err) {
        sails.log.error(`Unexpected error for ${product.name}:`, err.message);
        failCount++;
      }
    }

    sails.log('--------------------------------------------------');
    sails.log(`Finished embedding population.`);
    sails.log(`Success: ${successCount}`);
    sails.log(`Failed:  ${failCount}`);
    sails.log('--------------------------------------------------');
  }
};
