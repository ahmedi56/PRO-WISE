const sails = require('sails');

sails.load({
  log: { level: 'error' },
  hooks: { grunt: false }
}, async (err) => {
  if (err) {
    console.error(err);
    return process.exit(1);
  }

  try {
    // Mock checkHealth to simulate offline AI service
    if (sails.services.searchservice) {
      sails.services.searchservice.checkHealth = async () => false;
    }

    const findProduct = async (queryStr) => {
      // Find a product roughly matching
      return await Product.findOne({ name: { contains: queryStr } }).populate('category').populate('company');
    };

    console.log("=== Scenario 1: iPhone === ");
    let iphone14 = await findProduct('iPhone'); // maybe 'iPhone 14' doesn't exist, just 'iPhone'
    if (iphone14) {
       let recs = await sails.helpers.getSimilarityRecommendations.with({
         productId: iphone14.id, limit: 5, includeDiagnostics: true 
       });
       console.log("Base Product:", iphone14.name);
       console.log("Recommendations:\n", recs.data.map(r => ` - ${r.name} (Score: ${r.score}, Reason: ${r.recommendationReason})`).join('\n'));
    } else {
       console.log("iPhone not found in DB. Let's list what we have:");
       let all = await Product.find().limit(5);
       console.log(all.map(a => a.name));
    }

    console.log("\n=== Scenario 2: i7 Laptop === ");
    let i7Laptop = await findProduct('i7');
    if (!i7Laptop) i7Laptop = await findProduct('Core'); // fallback
    if (i7Laptop) {
       let recs = await sails.helpers.getSimilarityRecommendations.with({
         productId: i7Laptop.id, limit: 5, includeDiagnostics: true 
       });
       console.log("Base Product:", i7Laptop.name);
       console.log("Recommendations:\n", recs.data.map(r => ` - ${r.name} (Score: ${r.score}, Reason: ${r.recommendationReason})`).join('\n'));
    } else {
       console.log("i7 laptop not found in DB.");
    }

    console.log("\n=== Scenario 3: Samsung == ");
    let s22 = await findProduct('S22');
    if (!s22) s22 = await findProduct('Samsung');
    if (!s22) s22 = await findProduct('Galaxy');
    if (s22) {
       let recs = await sails.helpers.getSimilarityRecommendations.with({
         productId: s22.id, limit: 5, includeDiagnostics: true 
       });
       console.log("Base Product:", s22.name);
       console.log("Recommendations:\n", recs.data.map(r => ` - ${r.name} (Score: ${r.score}, Reason: ${r.recommendationReason})`).join('\n'));
    } else {
       console.log("Samsung not found in DB.");
    }

  } catch (error) {
    console.error(error);
  } finally {
    sails.lower();
  }
});
