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
    const Category = sails.models.category;

    // Find the ASUS company
    const company = await Company.findOne({ name: 'ASUSTeK Computer' });
    const companyId = company ? company.id : undefined;

    if (!companyId) {
        console.error("ASUSTeK Computer company not found!");
        return;
    }

    // Find the category of Computer
    const compCategory = await Category.findOne({ name: 'Computer' });

    // Create ASUS TUF Gaming F17
    const f17 = await Product.create({
        name: 'ASUS TUF Gaming F17',
        modelNumber: 'TUF-F17-2023',
        brand: 'ASUS',
        description: 'Large-scale gaming performance with a 17.3-inch display and military-grade durability.',
        content: 'Equipped with an Intel Core i7-12700H, NVIDIA RTX 4060, and a stunning 144Hz display.',
        category: compCategory ? compCategory.id : undefined,
        company: companyId,
        components: [
            { name: 'Intel Core i7-12700H', type: 'CPU', manufacturer: 'Intel', modelNumber: 'i7-12700H', specifications: '14 Cores (6P + 8E), up to 4.7GHz, 24MB Cache' },
            { name: 'NVIDIA GeForce RTX 4060', type: 'GPU', manufacturer: 'NVIDIA', modelNumber: 'RTX 4060', specifications: '8GB GDDR6, 140W TGP, MUX Switch + NVIDIA Advanced Optimus' },
            { name: '16GB DDR5 Memory', type: 'RAM', manufacturer: 'Generic', modelNumber: 'DDR5-4800', specifications: '16GB (8GB x 2), Dual Channel, Upgradable to 32GB' },
            { name: '1TB PCIe 4.0 SSD', type: 'Storage', manufacturer: 'Generic', modelNumber: 'NVMe Gen4', specifications: '1TB M.2 NVMe PCIe 4.0 SSD, Second M.2 slot available' },
            { name: '17.3" FHD 144Hz Display', type: 'Display', manufacturer: 'ASUS', modelNumber: 'IPS-144', specifications: '1920 x 1080 (FHD), 144Hz Refresh Rate, G-Sync, 250 nits' },
            { name: '90Wh Battery', type: 'Battery', manufacturer: 'ASUS', modelNumber: '4-Cell Li-ion', specifications: '90Whrs, 4-cell Li-ion, up to 10 hours of video playback' },
            { name: 'Backlit Chiclet Keyboard', type: 'Keyboard', manufacturer: 'ASUS', modelNumber: '1-Zone RGB', specifications: '1-Zone RGB Backlighting, highlighted WASD keys, 1.7mm travel' }
        ],
        status: 'published'
    }).fetch();

    console.log(`Successfully created: ${f17.name}`);
    console.log(`Added ${f17.components.length} components for verification.`);

  } catch(e) {
    console.error(e);
  } finally {
    sails.lower();
  }
}

run();
