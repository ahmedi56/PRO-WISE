module.exports = {
  friendlyName: 'Check embeddings',
  description: 'Check embeddings.',
  fn: async function () {
    const Product = sails.models.product;
    const all = await Product.find({ status: 'published' });
    sails.log.info(`Found ${all.length} published products.`);
    all.forEach(p => sails.log.info(p.name, '| components: ' + (p.components?.length || 0), '| embedding: ' + (p.embedding ? 'YES' : 'NO')));
  }
};
