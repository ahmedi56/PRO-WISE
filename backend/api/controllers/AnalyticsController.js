/**
 * AnalyticsController
 *
 * @description :: Server-side actions for handling analytics with tenant isolation.
 */

module.exports = {

  /**
     * GET /api/analytics
     *
     * @description :: View system analytics. Restricted by analytics.view permission.
     * Respects req.companyId for Company Administrators.
     */
  view: async function (req, res) {
    try {
      const companyId = req.companyId;
      const rawRole = req.user ? req.user.role : undefined;
      const roleName = typeof rawRole === 'string' ? rawRole : ((rawRole && rawRole.name) || '');
      const isSuperAdmin = !companyId && roleName.toLowerCase() === 'super_admin';

      // Governance stats (Super Admin only)
      let userStats = null;
      let companyStats = null;

      if (isSuperAdmin) {
        const totalUsers = await User.count();
        const adminRoles = await Role.find({ name: ['company_admin', 'administrator'] });
        const adminRoleIds = adminRoles.map(r => r.id);
        const pendingAdmins = await User.count({ 
          status: 'pending', 
          role: adminRoleIds 
        });
        const activeUsers = await User.count({ status: 'active' });
        userStats = { totalUsers, pendingAdmins, activeUsers };

        const totalCompanies = await Company.count();
        const pendingCompanies = await Company.count({ status: 'pending' });
        const deactivatedCompanies = await Company.count({ status: 'deactivated' });
        companyStats = { total: totalCompanies, pending: pendingCompanies, deactivated: deactivatedCompanies };

        return res.json({
          success: true,
          summary: {
            users: userStats,
            companies: companyStats
          }
        });
      }

      // Operational stats (Company Admin only)
      if (companyId) {
        const products = await Product.find({ company: companyId });
        const totalProducts = products.length;
        const publishedProducts = products.filter(p => p.status === 'published').length;
        const totalScans = products.reduce((acc, p) => acc + (p.totalScans || 0), 0);
        const totalGuides = await Guide.count({ product: products.map(p => p.id) });

        return res.json({
          success: true,
          summary: {
            products: {
              total: totalProducts,
              published: publishedProducts,
              scans: totalScans
            },
            guides: {
              total: totalGuides
            }
          }
        });
      }

      return res.status(403).json({ message: 'Forbidden: No management metrics available for this role.' });

    } catch (err) {
      sails.log.error('Analytics error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

};
