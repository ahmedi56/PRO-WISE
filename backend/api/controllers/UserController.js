/**
 * UserController
 *
 * @description :: Server-side actions for user management.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const ALLOWED_STATUSES = ['pending', 'active', 'deactivated'];

const sanitizeUser = (user) => _.omit(user, ['password']);

const normalizeEmail = (email) => String(email || '').toLowerCase().trim();

const resolveRole = async (roleInput) => {
  if (!roleInput) {
    return null;
  }

  const byId = await Role.findOne({ id: roleInput });
  if (byId) {
    return byId;
  }

  const byName = await Role.findOne({ name: String(roleInput).toLowerCase().trim() });
  return byName || null;
};

const writeAuditLog = async ({ req, action, target, details }) => {
  if (!req.user || !req.user.id) {
    return;
  }

  try {
    await AuditLog.create({
      action,
      user: req.user.id,
      target,
      details: details || {}
    });
  } catch (err) {
    sails.log.warn('Audit log write failed:', err.message);
  }
};

module.exports = {

  /**
     * PUT /api/users/profile
     * Update current user's profile
     */
  updateProfile: async function (req, res) {
    try {
      const { name, username, email, phone, avatar } = req.body;
      const userId = req.user.id;

      const user = await User.findOne({ id: userId });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const normalized = email !== undefined ? normalizeEmail(email) : undefined;

      if (normalized && normalized !== user.email) {
        const existingEmail = await User.findOne({ email: normalized });
        if (existingEmail) {
          return res.status(400).json({ message: 'Email already in use' });
        }
      }

      if (username && username !== user.username) {
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
          return res.status(400).json({ message: 'Username already in use' });
        }
      }

      const updateData = {};
      if (name !== undefined) {updateData.name = name;}
      if (username !== undefined) {updateData.username = username;}
      if (normalized !== undefined) {updateData.email = normalized;}
      if (phone !== undefined) {updateData.phone = phone;}
      if (avatar !== undefined) {updateData.avatar = avatar;}

      const updatedUser = await User.updateOne({ id: userId }).set(updateData);

      return res.json({
        message: 'Profile updated successfully',
        user: sanitizeUser(updatedUser)
      });

    } catch (err) {
      sails.log.error('Update profile error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
     * GET /api/users
     * Get all users (Super Admin only)
     */
  getAll: async function (req, res) {
    try {
      const { status, role, company, search } = req.query;
      const where = {};

      if (status) {
        const normalizedStatus = String(status).toLowerCase().trim();
        if (!ALLOWED_STATUSES.includes(normalizedStatus)) {
          return res.status(400).json({ message: 'Invalid status filter' });
        }
        where.status = normalizedStatus;
      }

      if (company) {
        where.company = company;
      }

      if (role) {
        const roleRecord = await resolveRole(role);
        if (!roleRecord) {
          return res.json([]);
        }
        where.role = roleRecord.id;
      }

      let users = await User.find(where)
                .populate('role')
                .populate('company')
                .sort('createdAt DESC');

      if (search) {
        const q = String(search).toLowerCase().trim();
        users = users.filter((u) =>
          String(u.name || '').toLowerCase().includes(q) ||
                    String(u.username || '').toLowerCase().includes(q) ||
                    String(u.email || '').toLowerCase().includes(q) ||
                    String(u.status || '').toLowerCase().includes(q) ||
                    String((u.role && u.role.name) || '').toLowerCase().includes(q) ||
                    String((u.company && u.company.name) || '').toLowerCase().includes(q)
        );
      }

      return res.json(users.map(sanitizeUser));
    } catch (err) {
      sails.log.error('Get all users error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
     * GET /api/users/:id
     * Get a specific user (Super Admin only)
     */
  getOne: async function (req, res) {
    try {
      const user = await User.findOne({ id: req.params.id })
                .populate('role')
                .populate('company');

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.json(sanitizeUser(user));
    } catch (err) {
      sails.log.error('Get user error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
     * PUT /api/users/:id/role
     * Update a user's role (Super Admin only)
     */
  updateRole: async function (req, res) {
    try {
      const { roleName } = req.body;
      if (!roleName) {
        return res.status(400).json({ message: 'roleName is required' });
      }

      const targetUser = await User.findOne({ id: req.params.id }).populate('role');
      if (!targetUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      const role = await Role.findOne({ name: String(roleName).toLowerCase().trim() });
      if (!role) {
        return res.status(400).json({ message: 'Invalid role' });
      }

      if (role.name === 'super_admin') {
        const targetEmail = normalizeEmail(targetUser.email);
        if (targetEmail !== 'superadmin@prowise.com') {
          return res.status(400).json({ message: 'Only the primary administrator account (superadmin@prowise.com) can hold the Super Admin role.' });
        }

        const superAdminRole = await Role.findOne({ name: 'super_admin' });
        if (superAdminRole) {
          const currentSAdminCount = await User.count({ 
            role: superAdminRole.id,
            id: { '!=': req.params.id }
          });
          
          if (currentSAdminCount >= 1) {
            return res.status(400).json({ message: 'Only one Super Admin account can exist in the system.' });
          }
        }
      }

      const isCompanyAdminRole = role.name === 'administrator' || role.name === 'company_admin';
      
      const updateData = { role: role.id };
      
      if (isCompanyAdminRole) {
        if (!targetUser.company && !req.body.company) {
          return res.status(400).json({ message: 'Company administrator users must belong to a company' });
        }
        
        const wasNotCompanyAdmin = !['administrator', 'company_admin'].includes(targetUser.role && targetUser.role.name);
        if (wasNotCompanyAdmin && targetUser.status !== 'deactivated') {
          updateData.status = 'pending';
        }
      } else {
        // If downgrading from admin to client, remove company association and ensure active
        updateData.company = null;
        if (targetUser.status === 'pending') {
          updateData.status = 'active';
        }
      }

      const user = await User.updateOne({ id: req.params.id }).set(updateData);
      const updatedUser = await User.findOne({ id: user.id }).populate('role').populate('company');

      await writeAuditLog({
        req,
        action: 'user.role.updated',
        target: `user:${updatedUser.id}`,
        details: {
          oldRole: targetUser.role && targetUser.role.name,
          newRole: role.name
        }
      });

      return res.json({
        message: 'User role updated',
        user: sanitizeUser(updatedUser)
      });

    } catch (err) {
      sails.log.error('Update role error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
     * DELETE /api/users/:id
     * Delete a user (Super Admin only)
     */
  deleteUser: async function (req, res) {
    try {
      if (req.params.id === req.user.id) {
        return res.status(400).json({ message: 'Cannot delete your own account' });
      }

      const targetUser = await User.findOne({ id: req.params.id }).populate('role');
      if (!targetUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Protect the only super_admin
      if (targetUser.role && targetUser.role.name === 'super_admin') {
        const superAdminCount = await User.count({ 
          role: targetUser.role.id 
        });
        if (superAdminCount <= 1) {
          return res.status(400).json({ message: 'Cannot delete the only Super Admin account.' });
        }
      }

      await User.destroyOne({ id: req.params.id });

      await writeAuditLog({
        req,
        action: 'user.deleted',
        target: `user:${targetUser.id}`,
        details: {
          email: targetUser.email,
          role: targetUser.role && targetUser.role.name,
          status: targetUser.status
        }
      });

      return res.json({ message: 'User deleted successfully' });

    } catch (err) {
      sails.log.error('Delete user error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
   * POST /api/users/bulk-delete
   * Delete multiple users at once (Super Admin only)
   */
  bulkDelete: async function (req, res) {
    try {
      const { userIds } = req.body;
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: 'User IDs array is required' });
      }

      // Prevent self-deletion
      const filteredIds = userIds.filter(id => id !== req.user.id);
      if (filteredIds.length === 0) {
        return res.status(400).json({ message: 'Cannot delete your own account via bulk action' });
      }

      // Protect super_admin from bulk deletion
      const usersToDelete = await User.find({ id: filteredIds }).populate('role');
      const hasSuperAdmin = usersToDelete.some(u => u.role && u.role.name === 'super_admin');
      if (hasSuperAdmin) {
        return res.status(400).json({ message: 'Bulk deletion cannot include Super Admin accounts.' });
      }

      const deletedUsers = await User.find({ id: filteredIds }).populate('role');
      await User.destroy({ id: filteredIds });

      // Audit logs for bulk delete
      for (const u of deletedUsers) {
        await writeAuditLog({
          req,
          action: 'user.deleted.bulk',
          target: `user:${u.id}`,
          details: { email: u.email, role: u.role && u.role.name }
        });
      }

      return res.json({ 
        message: `Successfully deleted ${deletedUsers.length} users`,
        deletedCount: deletedUsers.length
      });
    } catch (error) {
      sails.log.error('Bulk delete error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
     * PUT /api/users/:id/validate
     * Validate a pending Company Admin (Super Admin only)
     */
  validateAdmin: async function (req, res) {
    try {
      const user = await User.findOne({ id: req.params.id })
                .populate('role')
                .populate('company');

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const roleName = (user.role && user.role.name ? user.role.name : '').toLowerCase();
      const isCompanyAdminRole = roleName === 'administrator' || roleName === 'company_admin';
      
      if (!isCompanyAdminRole) {
        return res.status(400).json({ message: 'Only company administrators require validation' });
      }

      if (user.status !== 'pending') {
        return res.status(400).json({ message: 'Only pending administrator accounts can be approved' });
      }

      if (!user.company) {
        return res.status(400).json({ message: 'Administrator must be attached to a company before approval' });
      }

      if (user.company.status === 'deactivated') {
        return res.status(400).json({ message: 'Cannot approve admin for a deactivated company' });
      }

      // Also activate the company if it's pending
      let companyUpdated = false;
      if (user.company && user.company.id && user.company.status === 'pending') {
        const updatedCompany = await Company.updateOne({ id: user.company.id }).set({ status: 'active' });
        if (updatedCompany) {
          companyUpdated = true;
          await writeAuditLog({
            req,
            action: 'company.approved',
            target: `company:${user.company.id}`,
            details: { name: user.company.name }
          });
        }
      }

      const updated = await User.updateOne({ id: req.params.id }).set({ status: 'active' });
      const updatedUser = await User.findOne({ id: updated.id }).populate('role').populate('company');

      await writeAuditLog({
        req,
        action: 'admin.approved',
        target: `user:${updatedUser.id}`,
        details: {
          companyId: updatedUser.company && updatedUser.company.id,
          companyName: updatedUser.company && updatedUser.company.name
        }
      });

      if (sails.services.emailservice) {
        await sails.services.emailservice.sendApprovalEmail(updatedUser.email);
      }

      return res.json({
        message: 'Administrator validated successfully',
        user: sanitizeUser(updatedUser),
        companyStatus: updatedUser.company ? updatedUser.company.status : null
      });
    } catch (err) {
      sails.log.error('Validate admin error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
     * PUT /api/users/:id/deactivate
     * Deactivate any user (Super Admin only)
     */
  deactivateUser: async function (req, res) {
    try {
      if (req.params.id === req.user.id) {
        return res.status(400).json({ message: 'Cannot deactivate your own account' });
      }

      const targetUser = await User.findOne({ id: req.params.id }).populate('role');
      if (!targetUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Protect the only super_admin
      if (targetUser.role && targetUser.role.name === 'super_admin') {
        return res.status(400).json({ message: 'Cannot deactivate the Super Admin account.' });
      }

      await User.updateOne({ id: req.params.id }).set({ status: 'deactivated' });
      const updatedUser = await User.findOne({ id: req.params.id }).populate('role').populate('company');

      await writeAuditLog({
        req,
        action: 'user.deactivated',
        target: `user:${updatedUser.id}`,
        details: {
          email: updatedUser.email,
          role: updatedUser.role && updatedUser.role.name
        }
      });

      return res.json({
        message: 'User deactivated successfully',
        user: sanitizeUser(updatedUser)
      });
    } catch (err) {
      sails.log.error('Deactivate user error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
     * PUT /api/users/:id/activate
     * Activate a deactivated user (Super Admin only)
     */
  activateUser: async function (req, res) {
    try {
      const targetUser = await User.findOne({ id: req.params.id }).populate('role').populate('company');
      if (!targetUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      const roleName = (targetUser.role && targetUser.role.name ? targetUser.role.name : '').toLowerCase();
      const isCompanyAdminRole = roleName === 'administrator' || roleName === 'company_admin';
      if (isCompanyAdminRole && (targetUser.company && targetUser.company.status) === 'deactivated') {
        return res.status(400).json({ message: 'Cannot activate an administrator assigned to a deactivated company' });
      }

      await User.updateOne({ id: req.params.id }).set({ status: 'active' });
      const updatedUser = await User.findOne({ id: req.params.id }).populate('role').populate('company');

      await writeAuditLog({
        req,
        action: 'user.activated',
        target: `user:${updatedUser.id}`,
        details: {
          email: updatedUser.email,
          role: updatedUser.role && updatedUser.role.name
        }
      });

      return res.json({
        message: 'User activated successfully',
        user: sanitizeUser(updatedUser)
      });
    } catch (err) {
      sails.log.error('Activate user error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
     * PUT /api/users/:id
     * General edit for a user by Super Admin
     */
  updateUser: async function (req, res) {
    try {
      const { name, email, phone, avatar, company, role, status } = req.body;
      const targetUser = await User.findOne({ id: req.params.id }).populate('role').populate('company');

      if (!targetUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      const updateData = {};

      if (name !== undefined) {updateData.name = name;}
      if (phone !== undefined) {updateData.phone = phone;}
      if (avatar !== undefined) {updateData.avatar = avatar;}

      if (email !== undefined) {
        const normalized = normalizeEmail(email);
        const existing = await User.findOne({
          email: normalized,
          id: { '!=': req.params.id }
        });
        if (existing) {
          return res.status(400).json({ message: 'Email already in use' });
        }
        updateData.email = normalized;
      }

      let resolvedRole = targetUser.role;
      if (role !== undefined) {
        const roleRecord = await resolveRole(role);
        if (!roleRecord) {
          return res.status(400).json({ message: 'Invalid role' });
        }
        updateData.role = roleRecord.id;
        resolvedRole = roleRecord;

        // Check if trying to promote to super_admin and if one already exists
        if (roleRecord.name === 'super_admin') {
          const targetEmail = normalizeEmail(targetUser.email);
          if (targetEmail !== 'superadmin@prowise.com') {
            return res.status(400).json({ message: 'Only the primary administrator account can be Super Admin.' });
          }

          const sAdminRole = await Role.findOne({ name: 'super_admin' });
          if (sAdminRole) {
            const currentCount = await User.count({ 
              role: sAdminRole.id,
              id: { '!=': req.params.id }
            });

            if (currentCount >= 1) {
              return res.status(400).json({ message: 'Only one Super Admin account can exist.' });
            }
          }
        }
      }

      let resolvedCompany = targetUser.company ? targetUser.company.id : null;
      if (company !== undefined) {
        if (company === null || company === '') {
          resolvedCompany = null;
        } else {
          const companyRecord = await Company.findOne({ id: company });
          if (!companyRecord) {
            return res.status(400).json({ message: 'Company not found' });
          }
          resolvedCompany = companyRecord.id;
        }
        updateData.company = resolvedCompany;
      }

      if (status !== undefined) {
        const normalizedStatus = String(status).toLowerCase().trim();
        if (!ALLOWED_STATUSES.includes(normalizedStatus)) {
          return res.status(400).json({ message: 'Invalid status value' });
        }
        updateData.status = normalizedStatus;
      }

      const finalRoleName = (resolvedRole && resolvedRole.name ? resolvedRole.name : '').toLowerCase();
      const isFinalCompanyAdmin = finalRoleName === 'administrator' || finalRoleName === 'company_admin';
      
      if (isFinalCompanyAdmin) {
        if (!resolvedCompany) {
          return res.status(400).json({ message: 'Company administrator users must belong to a company' });
        }
      } else {
        // Client/other roles should not have a company
        updateData.company = null;
        if (updateData.status === 'pending') {
          updateData.status = 'active';
        }
      }

      if (req.params.id === req.user.id) {
        if (updateData.status && updateData.status !== 'active') {
          return res.status(400).json({ message: 'Cannot change your own account status from this endpoint' });
        }
        if (updateData.role && updateData.role !== (targetUser.role && targetUser.role.id)) {
          return res.status(400).json({ message: 'Cannot change your own role from this endpoint' });
        }
      }

      const updated = await User.updateOne({ id: req.params.id }).set(updateData);
      const updatedUser = await User.findOne({ id: updated.id }).populate('role').populate('company');

      await writeAuditLog({
        req,
        action: 'user.updated',
        target: `user:${updatedUser.id}`,
        details: {
          changedFields: Object.keys(updateData)
        }
      });

      return res.json({
        message: 'User updated successfully',
        user: sanitizeUser(updatedUser)
      });
    } catch (err) {
      sails.log.error('Update user error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

};
