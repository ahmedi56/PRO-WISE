const sails = require('sails');
sails.lift({ log: { level: 'error' } }, async (err) => {
  if (err) return console.error(err);
  try {
    const products = await Product.find({ name: { contains: 'Lenovo' } });
    if (products.length === 0) return console.log('No lenovo found');
    const p = products[0];
    console.log('Testing recommendations for:', p.name);
    
    // Call the helper directly
    const recs = await sails.helpers.getSimilarityRecommendations.with({
      productId: p.id,
      limit: 3
    });
    
    console.log(JSON.stringify(recs.map(r => ({
      name: r.name,
      score: r.score,
      reason: r.recommendationReason,
      details: r.matchDetails
    })), null, 2));
    
  } catch (e) {
    console.error('Error:', e);
  } finally {
    sails.lower();
  }
});
