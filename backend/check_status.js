
const sails = require('sails');

sails.lift({
  hooks: { 
    grunt: false, 
    views: false, 
    pubsub: false, 
    session: false,
    blueprints: false
  },
  log: { level: 'silent' }
}, async (err) => {
  if (err) {
    process.exit(1);
  }
  try {
    const allProducts = await Product.find();
    const pStatus = {};
    allProducts.forEach(p => {
      pStatus[p.status] = (pStatus[p.status] || 0) + 1;
    });
    console.log('Product statuses:', pStatus);

    const allCompanies = await Company.find();
    const cStatus = {};
    allCompanies.forEach(c => {
      cStatus[c.status] = (cStatus[c.status] || 0) + 1;
    });
    console.log('Company statuses:', cStatus);

    const asusProducts = await Product.find({
      or: [
        { name: { contains: 'asus' } },
        { manufacturer: { contains: 'asus' } },
        { name: { contains: 'ASUS' } },
        { manufacturer: { contains: 'ASUS' } }
      ]
    });
    console.log(`Found ${asusProducts.length} ASUS products:`);
    asusProducts.forEach(p => console.log(`- ${p.name} [${p.status}]`));

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
});
