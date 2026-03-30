module.exports = {
  friendlyName: 'Debug Recommendations',
  fn: async function() {
    try {
      const product = await Product.findOne({ name: 'iPhone 12' });
      if (!product) {
        console.log('iPhone 12 not found');
        return;
      }
      console.log(`Product: ${product.name}, ID: ${product.id}, Embedding: ${!!product.embedding}`);
      
      const recommendations = await sails.helpers.getSimilarityRecommendations.with({
        productId: product.id,
        limit: 5
      });
      
      console.log(`Recommendations count: ${recommendations.length}`);
      recommendations.forEach(r => {
        console.log(`- ${r.name} (Score: ${r.score.toFixed(2)}, Reason: ${r.recommendationReason})`);
      });

      const allPublished = await Product.find({ status: 'published' });
      console.log(`Total published products: ${allPublished.length}`);
      const withEmbeddings = allPublished.filter(p => p.embedding);
      console.log(`Published products with embeddings: ${withEmbeddings.length}`);

    } catch (err) {
      console.error('Debug script error:', err);
    }
  }
};
