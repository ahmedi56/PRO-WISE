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

      // Fetch approved technicians for the map
      const approvedTechs = await User.find({
        where: { technicianStatus: 'approved' },
        select: ['id', 'name', 'avatar', 'technicianProfile', 'createdAt']
      });

      const technicians = approvedTechs.map(tech => ({
        id: tech.id,
        name: tech.name,
        avatar: tech.avatar,
        headline: tech.technicianProfile?.headline,
        bio: tech.technicianProfile?.bio,
        skills: tech.technicianProfile?.skills,
        experienceYears: tech.technicianProfile?.experienceYears,
        city: tech.technicianProfile?.city,
        governorate: tech.technicianProfile?.governorate,
        latitude: tech.technicianProfile?.latitude,
        longitude: tech.technicianProfile?.longitude,
        serviceCategories: tech.technicianProfile?.serviceCategories,
        averageRating: tech.technicianProfile?.averageRating || 0,
        completedJobs: tech.technicianProfile?.completedJobs || 0,
        joinedAt: tech.createdAt
      }));

      return res.json({
        featuredProducts,
        categories,
        recommended,
        latestProducts,
        technicians
      });

    } catch (err) {
      sails.log.error('HomeController error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

};
