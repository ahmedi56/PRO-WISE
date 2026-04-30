module.exports = {

  view: async function (req, res) {
    try {
      const companyId = req.user.companyId || req.user.company;
      const rawRole = req.user ? req.user.role : undefined;
      const roleName = typeof rawRole === 'string' ? rawRole : ((rawRole && rawRole.name) || '');
      const isSuperAdmin = roleName.toLowerCase() === 'super_admin';

      // 1. Super Admin View (Global)
      if (isSuperAdmin) {
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
        
        const totalCompanies = await sails.models.company.count();
        const pendingCompanies = await sails.models.company.count({ status: 'pending' });
        
        const allProducts = await sails.models.product.find().select(['company', 'totalScans']);
        const companyScanMap = {};
        allProducts.forEach(p => {
          const cid = p.company && (p.company.id || p.company);
          if (cid) {
            companyScanMap[cid] = (companyScanMap[cid] || 0) + (p.totalScans || 0);
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

        return res.json({
          success: true,
          summary: {
            users: { totalUsers, activeUsers, pendingUsers, roles: roleBreakdown },
            companies: { total: totalCompanies, pending: pendingCompanies, topCompanies },
            products: {
              total: await sails.models.product.count(),
              published: await sails.models.product.count({ status: 'published' }),
              scans: allProducts.reduce((acc, p) => acc + (p.totalScans || 0), 0)
            },
            guides: {
              total: await sails.models.guide.count()
            }
          }
        });
      }

      // 2. Company Admin View (Scoped)
      if (companyId) {
        const totalUsers = await sails.models.user.count({ company: companyId });
        const activeUsers = await sails.models.user.count({ company: companyId, status: 'active' });
        const pendingUsers = await sails.models.user.count({ company: companyId, status: 'pending' });

        const companyProducts = await sails.models.product.find({ company: companyId }).select(['name', 'totalScans']).sort('totalScans DESC');
        const totalScans = companyProducts.reduce((acc, p) => acc + (p.totalScans || 0), 0);
        const mostViewedProduct = companyProducts.length > 0 ? companyProducts[0].name : 'N/A';

        // Count feedback for company's products
        const productIds = companyProducts.map(p => p.id);
        const feedbackCount = await sails.models.feedback.count({ product: productIds, isHidden: false });

        return res.json({
          success: true,
          summary: {
            users: { totalUsers, activeUsers, pendingUsers },
            products: {
              total: companyProducts.length,
              published: await sails.models.product.count({ company: companyId, status: 'published' }),
              scans: totalScans,
              mostViewed: mostViewedProduct
            },
            feedback: {
              total: feedbackCount
            },
            guides: {
              total: await sails.models.guide.count({ product: productIds })
            }
          }
        });
      }

      return res.status(403).json({ message: 'Forbidden: No management metrics available for this profile.' });

    } catch (err) {
      sails.log.error('Analytics error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

};

