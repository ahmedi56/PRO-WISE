/**
 * AdminController
 *
 * @description :: Actions for Super Admin management (users, companies, etc.)
 */

const sanitizeUser = (user) => _.omit(user, ['password']);


module.exports = {

  /**
   * GET /api/admin/users
   */
  getUsers: async function (req, res) {
    try {
      const { search, role, status, page = 1, limit = 50 } = req.query;
      const where = {};

      if (search) {
        where.or = [
          { name: { contains: search } },
          { email: { contains: search } }
        ];
      }
      if (role) {where.role = role;}
      if (status) {where.status = status;}

      const total = await User.count(where);
      const users = await User.find(where)
        .populate('role')
        .populate('company')
        .sort('createdAt DESC')
        .skip((page - 1) * limit)
        .limit(limit);

      return ResponseService.success(res, users.map(sanitizeUser), 'Users fetched', {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      });
    } catch (err) {
      return ResponseService.error(res, 'Failed to fetch users', 500, 'ADMIN_FETCH_USERS_ERROR', err);
    }
  },

  /**
   * GET /api/admin/users/:id
   */
  getUser: async function (req, res) {
    try {
      const user = await User.findOne({ id: req.params.id }).populate('role').populate('company');
      if (!user) {return ResponseService.notFound(res, 'User not found');}
      return ResponseService.success(res, sanitizeUser(user), 'User fetched');
    } catch (err) {
      return ResponseService.error(res, 'Failed to fetch user', 500, 'ADMIN_FETCH_USER_ERROR', err);
    }
  },
  /**
   * PUT /api/admin/users/:id/approve
   */
  approveUser: async function (req, res) {
    try {
      const user = await User.findOne({ id: req.params.id }).populate('role').populate('company');
      if (!user) {return ResponseService.notFound(res, 'User not found');}
      
      await User.updateOne({ id: user.id }).set({ status: 'active' });
      
      // If company admin, also activate company
      if (user.company && user.company.status === 'pending') {
        await Company.updateOne({ id: user.company.id }).set({ status: 'active' });
      }

      if (sails.services.emailservice) {
        await sails.services.emailservice.sendApprovalEmail(user.email);
      }

      return ResponseService.success(res, null, 'User approved');
    } catch (err) {
      return ResponseService.error(res, 'Failed to approve user', 500, 'ADMIN_APPROVE_ERROR', err);
    }
  },

  /**
   * GET /api/admin/technician/applications
   */
  getTechnicianApplications: async function (req, res) {
    try {
      const apps = await User.find({ technicianStatus: 'pending' }).sort('updatedAt DESC');
      return ResponseService.success(res, apps.map(sanitizeUser));
    } catch (err) {
      return ResponseService.error(res, 'Failed to fetch applications', 500, 'ADMIN_FETCH_APPS_ERROR', err);
    }
  },

  /**
   * PUT /api/admin/technician/:id/approve
   */
  approveTechnician: async function (req, res) {
    try {
      const user = await User.findOne({ id: req.params.id });
      if (!user) {return ResponseService.notFound(res, 'User not found');}

      const techRole = await Role.findOne({ name: 'technician' });
      
      await User.updateOne({ id: user.id }).set({
        isTechnician: true,
        technicianStatus: 'approved',
        role: techRole ? techRole.id : user.role
      });

      return ResponseService.success(res, null, 'Technician approved');
    } catch (err) {
      return ResponseService.error(res, 'Failed to approve technician', 500, 'ADMIN_APPROVE_TECH_ERROR', err);
    }
  },
  
  /**
   * PUT /api/admin/users/:id/deactivate
   */
  deactivateUser: async function (req, res) {
    try {
      const { id } = req.params;
      const user = await User.updateOne({ id }).set({ status: 'inactive' });
      if (!user) {return ResponseService.notFound(res, 'User not found');}
      return ResponseService.success(res, null, 'User deactivated');
    } catch (err) {
      return ResponseService.error(res, 'Failed to deactivate user', 500, 'ADMIN_DEACTIVATE_ERROR', err);
    }
  },

  /**
   * PUT /api/admin/users/:id/activate
   */
  activateUser: async function (req, res) {
    try {
      const { id } = req.params;
      const user = await User.updateOne({ id }).set({ status: 'active' });
      if (!user) {return ResponseService.notFound(res, 'User not found');}
      return ResponseService.success(res, null, 'User activated');
    } catch (err) {
      return ResponseService.error(res, 'Failed to activate user', 500, 'ADMIN_ACTIVATE_ERROR', err);
    }
  },

  /**
   * DELETE /api/admin/users/:id
   */
  deleteUser: async function (req, res) {
    try {
      const { id } = req.params;
      const userToDelete = await User.findOne({ id });
      if (!userToDelete) {return ResponseService.notFound(res, 'User not found');}
      
      if (userToDelete.email === 'admin@prowise.network') {
        return ResponseService.error(res, 'Cannot delete primary administrator', 403);
      }
      
      await User.destroyOne({ id });
      return ResponseService.success(res, null, 'User deleted');
    } catch (err) {
      return ResponseService.error(res, 'Failed to delete user', 500, 'ADMIN_DELETE_ERROR', err);
    }
  },

  /**
   * PUT /api/users/:id/role
   * Update a user's role (Super Admin only)
   */
  updateUserRole: async function (req, res) {
    try {
      const { id } = req.params;
      const { role, roleName } = req.body;

      const user = await User.findOne({ id });
      if (!user) {return ResponseService.notFound(res, 'User not found');}

      let roleRecord;
      if (role) {
        // role is an ID
        roleRecord = await Role.findOne({ id: role });
      } else if (roleName) {
        // roleName is a string like 'company_admin'
        roleRecord = await Role.findOne({ name: roleName });
      }

      if (!roleRecord) {
        return ResponseService.badRequest(res, 'Invalid role');
      }

      await User.updateOne({ id }).set({ role: roleRecord.id });
      const fullUser = await User.findOne({ id }).populate('role').populate('company');

      return ResponseService.success(res, { user: sanitizeUser(fullUser) }, 'Role updated');
    } catch (err) {
      return ResponseService.error(res, 'Failed to update role', 500, 'ADMIN_ROLE_UPDATE_ERROR', err);
    }
  },

  /**
   * PUT /api/users/:id/technician/reject
   * Reject a technician application
   */
  rejectTechnician: async function (req, res) {
    try {
      const user = await User.findOne({ id: req.params.id });
      if (!user) {return ResponseService.notFound(res, 'User not found');}

      const { rejectionReason } = req.body;

      await User.updateOne({ id: user.id }).set({
        technicianStatus: 'rejected',
        technicianRejectionReason: rejectionReason || 'Application did not meet requirements'
      });

      return ResponseService.success(res, null, 'Technician application rejected');
    } catch (err) {
      return ResponseService.error(res, 'Failed to reject technician', 500, 'ADMIN_REJECT_TECH_ERROR', err);
    }
  }

};
