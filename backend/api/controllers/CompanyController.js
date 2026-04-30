/**
 * CompanyController
 *
 * @description :: Server-side actions for company management.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const COMPANY_STATUSES = ['active', 'deactivated', 'pending'];

const logAction = async (req, options) => {
  if (sails.services.auditservice) {
    await sails.services.auditservice.log(req, options);
  }
};

module.exports = {

  /**
     * POST /api/companies
     * Create a new company (Super Admin only)
     */
  create: async function (req, res) {
    return res.status(403).json({ 
      message: 'Forbidden: Companies cannot be created manually by administrators. They are created automatically when a new Company Administrator registers on the platform.' 
    });
  },

  /**
     * GET /api/companies
     * Get all companies
     */
  getAll: async function (req, res) {
    try {
      const { status } = req.query;
      const where = {};

      if (status) {
        const normalizedStatus = String(status).toLowerCase().trim();
        if (!COMPANY_STATUSES.includes(normalizedStatus)) {
          return res.status(400).json({ message: 'Invalid company status filter' });
        }
        where.status = normalizedStatus;
      }

      if (req.query.category) {
        where.category = req.query.category;
      }

      let companies = await Company.find(where).sort('name ASC');

      // If the user is unauthenticated (e.g. registration page),
      // ONLY return a minimal list: id and name
      if (!req.user || !req.user.id) {
        companies = companies.map(c => ({
          id: c.id,
          name: c.name
        }));
        return res.json(companies);
      }

      const total = await Company.count(where);
      const { page = 1, limit = 50 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      let augmentedCompanies = await Company.find(where)
                .populate('products')
                .sort('name ASC')
                .skip(skip)
                .limit(parseInt(limit));

      const feedbackStats = await Feedback.find({ company: { in: augmentedCompanies.map(c => c.id) }, isHidden: false });
      
      const results = augmentedCompanies.map(c => {
          const companyFeedbacks = feedbackStats.filter(f => f.company === c.id);
          const sum = companyFeedbacks.reduce((acc, curr) => acc + curr.rating, 0);
          const avg = companyFeedbacks.length > 0 ? (sum / companyFeedbacks.length).toFixed(1) : 0;
          return {
              ...c,
              averageRating: parseFloat(avg),
              ratingCount: companyFeedbacks.length,
              productCount: c.products ? c.products.length : 0
          };
      });

      return res.json({
        data: results,
        meta: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });

    } catch (err) {
      sails.log.error('Get companies error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
     * GET /api/companies/:id
     * Get a single company
     */
  getOne: async function (req, res) {
    try {
      const company = await Company.findOne({ id: req.params.id })
                .populate('products');

      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }

      return res.json(company);

    } catch (err) {
      sails.log.error('Get company error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
     * PUT /api/companies/:id
     * Update a company (Super Admin only)
     */
  update: async function (req, res) {
    try {
      const { name, description, status, logo, contactInfo, address, website } = req.body;
      const existing = await Company.findOne({ id: req.params.id });

      if (!existing) {
        return res.status(404).json({ message: 'Company not found' });
      }

      // 1 & 4. Tenant Isolation / Role Check
      const userCompanyId = String(req.user?.companyId || '');
      const userRole = typeof req.user?.role === 'object' ? req.user?.role?.name : req.user?.role;
      
      const isSuperAdmin = userRole === 'super_admin';
      const isCompanyAdmin = userRole === 'company_admin' || userRole === 'administrator';

      if (!isSuperAdmin) {
        if (!isCompanyAdmin || String(req.params.id) !== userCompanyId) {
          sails.log.warn(`Forbidden company update: User ${req.user.id} (Company: ${userCompanyId}, Role: ${userRole}) tried to update Company ${req.params.id}`);
          return res.status(403).json({ 
            message: 'Forbidden: You can only update your own company profile',
            debug: { userCompanyId, targetCompanyId: req.params.id }
          });
        }
      }

      const updateData = {};
      if (name !== undefined && isSuperAdmin) { // Only super admin can change company name? or allow company admin too?
        // Let's allow company admin to change name too if approved
        const normalizedName = String(name).trim();
        if (!normalizedName) {
          return res.status(400).json({ message: 'Company name cannot be empty' });
        }
        updateData.name = normalizedName;
      }
      
      if (description !== undefined) {updateData.description = description;}
      if (logo !== undefined) {updateData.logo = logo;}
      if (contactInfo !== undefined) {updateData.contactInfo = contactInfo;}
      if (address !== undefined) {updateData.address = address;}
      if (website !== undefined) {updateData.website = website;}

      if (status !== undefined && isSuperAdmin) {
        const normalizedStatus = String(status).toLowerCase().trim();
        if (!COMPANY_STATUSES.includes(normalizedStatus)) {
          return res.status(400).json({ message: 'Invalid company status' });
        }
        updateData.status = normalizedStatus;
      }

      const company = await Company.updateOne({ id: req.params.id }).set(updateData);

      await logAction(req, {
        action: 'company.updated',
        target: company.id,
        targetType: 'Company',
        targetLabel: company.name,
        details: {
          changedFields: Object.keys(updateData)
        }
      });

      return res.json(company);

    } catch (err) {
      if (err.code === 'E_UNIQUE') {
        return res.status(400).json({ message: 'A company with this name already exists' });
      }
      sails.log.error('Update company error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
     * PUT /api/companies/:id/deactivate
     * Deactivate a company and all of its administrator accounts.
     */
  deactivate: async function (req, res) {
    try {
      const company = await Company.findOne({ id: req.params.id });
      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }

      const updatedCompany = await Company.updateOne({ id: company.id }).set({ status: 'deactivated' });

      const roles = await Role.find({
        name: { in: ['administrator', 'company_admin'] }
      });
      const roleIds = roles.map(r => r.id);
      
      if (roleIds.length > 0) {
        await User.update({
          company: company.id,
          role: { in: roleIds }
        }).set({ status: 'deactivated' });
      }

      await logAction(req, {
        action: 'company.deactivated',
        target: company.id,
        targetType: 'Company',
        targetLabel: company.name,
        severity: 'warning',
        details: { name: company.name }
      });

      return res.json({
        message: 'Company deactivated successfully',
        company: updatedCompany
      });
    } catch (err) {
      sails.log.error('Deactivate company error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
     * PUT /api/companies/:id/activate
     * Activate a company and optionally its admins.
     */
  activate: async function (req, res) {
    try {
      const company = await Company.findOne({ id: req.params.id });
      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }

      const updatedCompany = await Company.updateOne({ id: company.id }).set({ status: 'active' });

      // Also activate any pending administrators for this company
      const roles = await Role.find({ name: { in: ['administrator', 'company_admin'] } });
      const roleIds = roles.map(r => r.id);
      if (roleIds.length > 0) {
        await User.update({
          company: company.id,
          role: { in: roleIds },
          status: 'pending'
        }).set({ status: 'active' });
      }

      await logAction(req, {
        action: 'company.activated',
        target: company.id,
        targetType: 'Company',
        targetLabel: company.name,
        details: { name: company.name }
      });

      return res.json({
        message: 'Company activated successfully',
        company: updatedCompany
      });
    } catch (err) {
      sails.log.error('Activate company error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
     * PUT /api/companies/:id/approve
     * Specifically for Super Admin to approve a new company request.
     */
  approve: async function (req, res) {
    try {
      const company = await Company.findOne({ id: req.params.id });
      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }

      if (company.status !== 'pending') {
        return res.status(400).json({ message: 'Company is not in pending status' });
      }

      const updatedCompany = await Company.updateOne({ id: company.id }).set({ status: 'active' });

      // Activate any pending administrators for this company
      const roles = await Role.find({ name: { in: ['administrator', 'company_admin'] } });
      const roleIds = roles.map(r => r.id);
      if (roleIds.length > 0) {
        const approvedUsers = await User.update({
          company: company.id,
          role: { in: roleIds },
          status: 'pending'
        }).set({ status: 'active' }).fetch();

        // Send approval emails if service exists
        if (sails.services.emailservice) {
          for (const user of approvedUsers) {
            await sails.services.emailservice.sendApprovalEmail(user.email);
          }
        }
      }

      await logAction(req, {
        action: 'company.approved',
        target: company.id,
        targetType: 'Company',
        targetLabel: company.name,
        details: { name: company.name }
      });

      return res.json({
        message: 'Company and associated administrators approved successfully',
        company: updatedCompany
      });
    } catch (err) {
      sails.log.error('Approve company error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
     * DELETE /api/companies/:id
     * Delete a company (Super Admin only)
     */
  delete: async function (req, res) {
    try {
      const company = await Company.findOne({ id: req.params.id });
      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }

      const products = await Product.count({ company: req.params.id });
      if (products > 0) {
        return res.status(400).json({
          message: `Cannot delete company: ${products} product(s) are still associated`
        });
      }

      const users = await User.count({ company: req.params.id });
      if (users > 0) {
        return res.status(400).json({
          message: `Cannot delete company: ${users} user account(s) are still associated`
        });
      }

      await Company.destroyOne({ id: req.params.id });

      await logAction(req, {
        action: 'company.deleted',
        target: company.id,
        targetType: 'Company',
        targetLabel: company.name,
        severity: 'warning',
        details: { name: company.name }
      });

      return res.json({ message: 'Company deleted successfully' });

    } catch (err) {
      sails.log.error('Delete company error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

};
