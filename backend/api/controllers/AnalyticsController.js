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
        // Detailed user breakdown by role
        const allRoles = await sails.models.role.find();
        const roleBreakdown = [];
        for (const r of allRoles) {
          const countForRole = await sails.models.user.count({ role: r.id });
          roleBreakdown.push({
            name: r.name,
            displayName: (r.name || '').replace(/_/g, ' ').toUpperCase(),
            count: countForRole
          });
        }

        const totalUsers = await sails.models.user.count();
        const activeUsers = await sails.models.user.count({ status: 'active' });
        const pendingUsers = await sails.models.user.count({ status: 'pending' });
        userStats = { totalUsers, activeUsers, pendingUsers, roles: roleBreakdown };

        const totalCompanies = await sails.models.company.count();
        const pendingCompanies = await sails.models.company.count({ status: 'pending' });
        const deactivatedCompanies = await sails.models.company.count({ status: 'deactivated' });
        
        // Calculate Top Companies by Engagement
        const allProducts = await sails.models.product.find().select(['company', 'totalScans']);
        const companyScanMap = {};
        allProducts.forEach(p => {
          if (p.company) {
            companyScanMap[p.company] = (companyScanMap[p.company] || 0) + (p.totalScans || 0);
          }
        });
        
        let topCompanies = [];
        const companyIds = Object.keys(companyScanMap);
        if (companyIds.length > 0) {
          const companiesData = await sails.models.company.find({ id: companyIds }).select(['id', 'name']);
          topCompanies = companiesData.map(c => ({
            name: c.name,
            visits: companyScanMap[c.id] || 0
          })).sort((a, b) => b.visits - a.visits).slice(0, 5);
        }

        companyStats = { total: totalCompanies, pending: pendingCompanies, deactivated: deactivatedCompanies, topCompanies };

        // Global Operational stats for Super Admin
        const totalProducts = await sails.models.product.count();
        const publishedProducts = await sails.models.product.count({ status: 'published' });
        const totalScans = allProducts.reduce((acc, p) => acc + (p.totalScans || 0), 0);
        const totalGuides = await sails.models.guide.count();

        return res.json({
          success: true,
          summary: {
            users: userStats,
            companies: companyStats,
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

      // If we reached here without a response, it means the user was NOT a Super Admin
      return res.status(403).json({ message: 'Forbidden: Analytics are restricted to Super Administrators only.' });

      return res.status(403).json({ message: 'Forbidden: No management metrics available for this role.' });

    } catch (err) {
      sails.log.error('Analytics error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

};
