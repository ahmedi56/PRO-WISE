require('dotenv').config();
const sails = require('sails');
const rc = require('sails/accessible/rc');

async function run() {
  const config = rc('sails');
  config.hooks = config.hooks || {};
  config.hooks.orm = require('sails-hook-orm');
  config.hooks.grunt = false;
  config.hooks.sockets = false;
  config.hooks.pubsub = false;
  config.log = { level: 'error' };

  await new Promise((resolve, reject) => {
    sails.load(config, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });

  try {
    const User = sails.models.user;
    const Category = sails.models.category;
    const Product = sails.models.product;
    const Company = sails.models.company;

    // find amir
    const amir = await User.findOne({ email: 'amir@gmail.com' });
    console.log("Amir user:", amir ? amir.id : "Not Found");
    
    // find his company
    let companyId;
    if (amir) {
        companyId = amir.company;
    } else {
        const company = await Company.findOne({ name: 'ASUSTeK Computer' });
        if (company) companyId = company.id;
    }
    
    if (!companyId) {
        console.log("No Asus company found!");
        return;
    }

    // find existing products for that company
    const existingAsus = await Product.find({ company: companyId });
    console.log("Existing ASUS products:", existingAsus.map(p => p.name));
    
    if (existingAsus.length > 0) {
        const template = existingAsus[0];
        console.log("Template product:", template.name);
        
        let newName = template.name + ' Plus';
        
        const newProd = await Product.create({
            name: newName,
            modelNumber: template.modelNumber + '-PLUS',
            brand: template.brand,
            description: 'Another high performance PC from ASUS to test AI.',
            category: template.category, // copy category
            company: companyId
        }).fetch();
        
        console.log("Newly created ASUS PC:", newProd.name);
        
        // now test the recommendation model
        console.log("Testing recommendation for the new product...");
        if (sails.services.searchservice) {
          sails.services.searchservice.checkHealth = async () => false; // simulate offline
        }
        
        const recs = await sails.helpers.getSimilarityRecommendations.with({
          productId: newProd.id, limit: 5, includeDiagnostics: true 
        });
        
        console.log("Recommendations:\n", recs.data.map(r => ` - ${r.name} (Score: ${r.score}, Reason: ${r.recommendationReason})`).join('\n'));
    } else {
        console.log("No existing ASUS products found to use as template!");
    }

  } catch(e) {
    console.error(e);
  } finally {
    sails.lower();
  }
}

run();
