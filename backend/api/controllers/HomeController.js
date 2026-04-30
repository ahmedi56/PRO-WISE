/**
 * HomeController
 *
 * @description :: Server-side actions for the Homepage.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {

  index: async function (req, res) {
    try {
      const categories = await Category.find({ parent: null }).limit(8);
      
      const latestProducts = await Product.find({ status: 'published' })
        .populate('company')
        .sort('createdAt DESC')
        .limit(4);
        
      const featuredProducts = await Product.find({ status: 'published' })
        .populate('company')
        .sort('totalScans DESC')
        .limit(4);

      // Simple generic recommendation for homepage using some popular products
      const recommended = await Product.find({ status: 'published' })
        .populate('company')
        .sort('updatedAt DESC') // fallback for now
        .skip(4)
        .limit(4);

      return res.json({
        featuredProducts,
        categories,
        recommended,
        latestProducts
      });

    } catch (err) {
      sails.log.error('HomeController error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

};
