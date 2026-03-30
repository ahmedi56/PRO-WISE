module.exports = {
  friendlyName: 'Find phone categories',
  fn: async function () {
    const phoneCat = await Category.findOne({ name: 'Phone' });
    if (!phoneCat) {
      console.log('Phone category not found');
      return;
    }
    console.log('Root Phone Category:', JSON.stringify(phoneCat, null, 2));

    const children = await Category.find({ parent: phoneCat.id });
    console.log('Phone Child Categories:', JSON.stringify(children, null, 2));

    const products = await Product.find({ category: phoneCat.id }).populate('company');
    console.log('Products directly under root Phone:', products.length);
    products.forEach(p => {
      console.log(`- ${p.name} (Manufacturer: ${p.manufacturer}, Company: ${p.company ? p.company.name : 'N/A'})`);
    });
  }
};
