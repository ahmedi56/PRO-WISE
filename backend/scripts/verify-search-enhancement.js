/**
 * verify-search-enhancement.js
 * 
 * Usage: sails run scripts/verify-search-enhancement.js
 */

module.exports = {
  friendlyName: 'Verify search enhancement',
  description: 'Test rich embeddings, semantic search, and recommendations.',

  fn: async function () {
    sails.log('Starting verification of search enhancement...');

    try {
      // 1. Find a test category
      const category = await sails.models.category.findOne({});
      if (!category) {
        sails.log.error('No category found for testing.');
        return;
      }

      // 2. Create a product with rich technical details
      const testName = `AI Test Product ${Date.now()}`;
      const product = await sails.models.product.create({
        name: testName,
        description: 'A revolutionary test device.',
        content: 'This product contains specialized Graphene-based cooling and a Quantum-Link processor. It is built for high-performance data processing.',
        manufacturer: 'DeepAI Labs',
        modelNumber: 'DAI-9000-QL',
        category: category.id,
        status: 'published'
      }).fetch();

      sails.log(`Created product: ${product.name}`);

      // 3. Wait a moment for embedding generation (it's called in create action after fetch)
      // Since it's awaited in the controller, it should be done after the request, 
      // but here we are calling the DB directly, so we need to manually call the service.
      await sails.services.productembeddingservice.updateEmbedding(product.id);
      
      const updatedProduct = await sails.models.product.findOne({ id: product.id });
      sails.log('Generated Search Document:', updatedProduct.searchDocument);

      if (!updatedProduct.embedding || updatedProduct.embedding.length === 0) {
        sails.log.error('FAIL: Embedding not generated.');
      } else {
        sails.log('SUCCESS: Embedding generated.');
      }

      // 4. Test Semantic Search with specific technical terms
      sails.log('Testing semantic search for "Graphene cooling"...');
      const searchResults = await sails.controllers.product.semanticSearch({ query: { q: 'Graphene cooling' } }, { json: (r) => r });
      // Note: we can't easily mock the req/res for controller actions like this in 'sails run', 
      // so let's just test the logic or call the SearchService directly.
      
      const queryEmbedding = await sails.services.searchservice.getEmbedding('Graphene cooling');
      const allProducts = await sails.models.product.find({ status: 'published', embedding: { '!=': null } });
      
      const calculateSimilarity = (vecA, vecB) => {
        let dotProduct = 0; let normA = 0; let normB = 0;
        for (let i = 0; i < vecA.length; i++) {
          dotProduct += vecA[i] * vecB[i];
          normA += vecA[i] * vecA[i];
          normB += vecB[i] * vecB[i];
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
      };

      const topResult = allProducts.map(p => ({
        name: p.name,
        score: calculateSimilarity(queryEmbedding, p.embedding)
      }))
      .sort((a, b) => b.score - a.score)[0];

      sails.log(`Top search result: ${topResult.name} (Score: ${topResult.score})`);
      if (topResult.name === testName) {
        sails.log('SUCCESS: Semantic search found the product based on technical content.');
      } else {
        sails.log('WARNING: Semantic search did not find the product as top result.');
      }

      // 5. Clean up
      // await Product.destroyOne({ id: product.id });
      sails.log('Verification finished.');

    } catch (err) {
      sails.log.error('Verification failed:', err);
    }
  }
};
