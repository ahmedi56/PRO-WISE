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
    const Product = sails.models.product;
    const Company = sails.models.company;

    // find amir
    const amir = await User.findOne({ email: 'amir@gmail.com' });
    let companyId;
    if (amir) {
        companyId = amir.company;
    } else {
        const company = await Company.findOne({ name: 'ASUSTeK Computer' });
        if (company) companyId = company.id;
    }
    
    // Find the category of Computer
    const Category = sails.models.category;
    const compCategory = await Category.findOne({ name: 'Computer' });

    // Destroy existing F17 models to replace them (REMOVED: Keeping F17)
    // const destroyed = await Product.destroy({ name: { contains: 'TUF Gaming F17' }, company: companyId }).fetch();
    // console.log(`Deleted ${destroyed.length} F17 products.`);

    // Create ASUS TUF Gaming F15
    const f15 = await Product.create({
        name: 'ASUS TUF Gaming F15',
        modelNumber: 'TUF-F15-2023',
        brand: 'ASUS',
        description: 'ASUS TUF Gaming F15 offering optimized gaming performance.',
        content: 'Features an Intel Core i5 processor, RTX 4070, and up to 64GB DDR5 memory.',
        category: compCategory ? compCategory.id : undefined,
        company: companyId,
        components: [
            { name: 'Core i5 Processor', type: 'CPU', manufacturer: 'Intel', modelNumber: 'i5-11400H', specifications: 'Intel Core i5-11400H' },
            { name: 'GeForce RTX Graphics', type: 'GPU', manufacturer: 'NVIDIA', modelNumber: 'RTX 4070', specifications: 'GeForce RTX 4070 with a MUX switch' },
            { name: 'DDR5 Memory', type: 'RAM', manufacturer: 'Generic', modelNumber: 'DDR5 4800MHz', specifications: '32 GB or 64 GB options' },
            { name: 'NVMe SSD', type: 'Storage', manufacturer: 'Generic', modelNumber: 'PCIe 3.0/4.0', specifications: '512 GB to 2 TB NVMe PCIe SSD, second free M.2 slot' }
        ],
        status: 'published'
    }).fetch();

    console.log(`Successfully created: ${f15.name}`);
    console.log(`Processor: ${f15.components[0].specifications}`);
    console.log(`Graphics: ${f15.components[1].specifications}`);
    console.log(`RAM: ${f15.components[2].specifications}`);
    console.log(`Storage: ${f15.components[3].specifications}`);
    
    // Test recommendation
    console.log("\nTesting recommendation for the new product...");
    if (sails.services.searchservice) {
        sails.services.searchservice.checkHealth = async () => false; // simulate offline
    }
    
    const recs = await sails.helpers.getSimilarityRecommendations.with({
        productId: f15.id, limit: 3, includeDiagnostics: true 
    });
    
    if (recs && recs.data && recs.data.length > 0) {
        console.log("Recommendations:\n", recs.data.map(r => ` - ${r.name} (Score: ${r.score}, Reason: ${r.recommendationReason})`).join('\n'));
    } else {
        console.log("No recommendations found.");
    }

  } catch(e) {
    console.error(e);
  } finally {
    sails.lower();
  }
}

run();
