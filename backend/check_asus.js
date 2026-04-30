
async function checkAsus() {
  const sails = require('sails');
  
  sails.lift({
    hooks: { grunt: false },
    log: { level: 'error' }
  }, async (err) => {
    if (err) {
      console.error('Could not lift Sails:', err);
      process.exit(1);
    }
    
    try {
      console.log('--- Checking Products ---');
      const products = await Product.find({
        or: [
          { name: { contains: 'asus' } },
          { manufacturer: { contains: 'asus' } }
        ]
      });
      console.log(`Found ${products.length} products total.`);
      products.forEach(p => {
        console.log(`Product: ${p.name}, Status: ${p.status}, Manufacturer: ${p.manufacturer}`);
      });

      console.log('\n--- Checking Companies ---');
      const companies = await Company.find({
        name: { contains: 'asus' }
      });
      console.log(`Found ${companies.length} companies total.`);
      companies.forEach(c => {
        console.log(`Company: ${c.name}, Status: ${c.status}`);
      });

      process.exit(0);
    } catch (e) {
      console.error('Error during check:', e);
      process.exit(1);
    }
  });
}

checkAsus();
