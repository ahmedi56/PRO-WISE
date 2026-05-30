
module.exports = {
  friendlyName: 'Check DB',
  description: 'Check ASUS products in DB',

  fn: async function() {
    const Company = sails.models.company;
    const Product = sails.models.product;

    const asus = await Company.findOne({ name: 'ASUS' });
    if (!asus) {
      sails.log.error('CRITICAL: ASUS Company not found in DB!');
      const allCompanies = await Company.find();
      sails.log.info('Available companies:', allCompanies.map(c => c.name));
      return;
    }
    sails.log.info(`ASUS Company found: ID=${asus.id}`);

    const products = await Product.find({ manufacturer: 'ASUS' });
    sails.log.info(`Found ${products.length} products with manufacturer='ASUS'`);
    
    products.forEach(p => {
      sails.log.info(`- Product: ${p.name}, ID: ${p.id}, CompanyID: ${p.company}, Status: ${p.status}`);
    });

    const productsByCompany = await Product.find({ company: asus.id });
    sails.log.info(`Found ${productsByCompany.length} products linked to ASUS company ID`);
    productsByCompany.forEach(p => {
      sails.log.info(`- Product: ${p.name}, ID: ${p.id}`);
    });
  }
};
