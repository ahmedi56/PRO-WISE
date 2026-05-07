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

const logAction = async (req, options) => {
  if (sails.services.auditservice) {
    await sails.services.auditservice.log(req, options);
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
      if (username !== undefined) {updateData.username = String(username).toLowerCase().trim();}
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
      const { status, role, company, search, page = 1, limit = 50 } = req.query;
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
        if (roleRecord) {
          where.role = roleRecord.id;
        } else {
          return res.json({ data: [], meta: { total: 0, page: 1, limit: 50, totalPages: 0 } });
        }
      }

      if (search) {
        const q = String(search).toLowerCase().trim();
        where.or = [
          { name: { contains: q } },
          { username: { contains: q } },
          { email: { contains: q } }
        ];
      }

      const total = await User.count(where);
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const users = await User.find(where)
        .populate('role')
        .populate('company')
        .sort('createdAt DESC')
        .skip(skip)
        .limit(parseInt(limit));

      return res.json({
        data: users.map(sanitizeUser),
        meta: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
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

      await logAction(req, {
        action: 'user.role_changed',
        target: updatedUser.id,
        targetType: 'User',
        targetLabel: updatedUser.name || updatedUser.email,
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

      await logAction(req, {
        action: 'user.deleted',
        target: targetUser.id,
        targetType: 'User',
        targetLabel: targetUser.name || targetUser.email,
        severity: 'warning',
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
        await logAction(req, {
          action: 'user.deleted',
          target: u.id,
          targetType: 'User',
          targetLabel: u.name || u.email,
          severity: 'warning',
          details: { 
            email: u.email, 
            role: u.role && u.role.name,
            context: 'bulk_delete'
          }
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
      
      if (user.status !== 'pending') {
        return res.status(400).json({ message: 'Only pending accounts can be approved' });
      }

      const updateData = { status: 'active' };

      // Role-specific logic
      if (isCompanyAdminRole) {
        if (!user.company) {
          return res.status(400).json({ message: 'Administrator must be attached to a company before approval' });
        }

        if (user.company.status === 'deactivated') {
          return res.status(400).json({ message: 'Cannot approve admin for a deactivated company' });
        }

        // Also activate the company if it's pending
        if (user.company.status === 'pending') {
          await Company.updateOne({ id: user.company.id }).set({ status: 'active' });
          await logAction(req, {
            action: 'company.approved',
            target: user.company.id,
            targetType: 'Company',
            targetLabel: user.company.name,
            details: { 
              triggeredByAdmin: user.id 
            }
          });
        }
      } else if (roleName === 'user' || roleName === 'customer') {
        // This is a technician upgrade request. Promote them!
        const techRole = await Role.findOne({ name: 'technician' });
        if (techRole) {
          updateData.role = techRole.id;
        }
      }

      const updated = await User.updateOne({ id: req.params.id }).set(updateData);
      const updatedUser = await User.findOne({ id: updated.id }).populate('role').populate('company');

      await logAction(req, {
        action: 'user.activated',
        target: updatedUser.id,
        targetType: 'User',
        targetLabel: updatedUser.name || updatedUser.email,
        details: {
          role: updatedUser.role && updatedUser.role.name,
          companyId: updatedUser.company && updatedUser.company.id,
          context: 'admin_validation'
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

      await logAction(req, {
        action: 'user.deactivated',
        target: updatedUser.id,
        targetType: 'User',
        targetLabel: updatedUser.name || updatedUser.email,
        severity: 'warning',
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

      await logAction(req, {
        action: 'user.activated',
        target: updatedUser.id,
        targetType: 'User',
        targetLabel: updatedUser.name || updatedUser.email,
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

      await logAction(req, {
        action: 'user.updated',
        target: updatedUser.id,
        targetType: 'User',
        targetLabel: updatedUser.name || updatedUser.email,
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
  },

  /**
   * POST /api/users/technician/request
   * Submit technician application
   */
  requestTechnicianUpgrade: async function (req, res) {
    try {
      const user = await User.findOne({ id: req.user.id }).populate('role');
      if (!user) {return res.status(404).json({ message: 'User not found' });}

      const roleName = (user.role && user.role.name ? user.role.name : '').toLowerCase();
      
      if (user.technicianStatus === 'approved') {
        return res.status(400).json({ message: 'You are already an approved technician' });
      }

      if (['administrator', 'company_admin', 'super_admin'].includes(roleName)) {
        return res.status(403).json({ message: 'Administrators cannot become technicians' });
      }

      const {
        headline,
        bio,
        skills,
        experienceYears,
        city,
        governorate,
        serviceCategories,
        phone,
        whatsapp
      } = req.body;

      // Validation
      if (!headline || !bio || !skills || !experienceYears || !city || !governorate || !serviceCategories) {
        return res.status(400).json({ message: 'All required application fields must be provided' });
      }

      if (!phone && !whatsapp) {
        return res.status(400).json({ message: 'At least one contact method (phone or whatsapp) is required' });
      }

      if (!Array.isArray(skills) || skills.length === 0) {
        return res.status(400).json({ message: 'At least one skill is required' });
      }

      if (!Array.isArray(serviceCategories) || serviceCategories.length === 0) {
        return res.status(400).json({ message: 'At least one service category is required' });
      }

      const profile = {
        headline,
        bio,
        skills,
        experienceYears,
        experienceStartDate: req.body.experienceStartDate,
        cvLink: req.body.cvLink,
        city,
        governorate,
        serviceCategories,
        phone,
        whatsapp,
        certifications: req.body.certifications || [],
        preferredContactMethod: req.body.preferredContactMethod || 'phone',
        serviceRadiusKm: req.body.serviceRadiusKm || 20,
        completedJobs: 0,
        averageRating: 0,
        availability: {
          weekdays: true,
          weekends: false,
          morning: true,
          afternoon: true,
          evening: false,
          emergencyAvailable: false
        }
      };

      await User.updateOne({ id: req.user.id }).set({
        technicianStatus: 'pending',
        technicianProfile: profile
      });

      await logAction(req, {
        action: 'technician.application_submitted',
        target: user.id,
        targetType: 'User',
        targetLabel: user.name || user.email,
        details: { 
          headline 
        }
      });

      return res.json({ 
        message: 'Your technician application has been submitted and is pending review.',
        status: 'pending'
      });
    } catch (err) {
      sails.log.error('Request technician application error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
   * GET /api/users/technician/me
   * Get own technician status/profile
   */
  getTechnicianMe: async function (req, res) {
    try {
      const user = await User.findOne({ id: req.user.id });
      if (!user) {return res.status(404).json({ message: 'User not found' });}

      return res.json({
        isTechnician: user.isTechnician,
        technicianStatus: user.technicianStatus,
        technicianProfile: user.technicianProfile
      });
    } catch (err) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
   * PUT /api/users/technician/profile
   * Edit full technician profile (Approved only)
   */
  updateTechnicianProfile: async function (req, res) {
    try {
      const user = await User.findOne({ id: req.user.id });
      if (!user) {return res.status(404).json({ message: 'User not found' });}

      if (!user.isTechnician || user.technicianStatus !== 'approved') {
        return res.status(403).json({ message: 'Only approved technicians can edit their profile' });
      }

      const currentProfile = user.technicianProfile || {};
      const allowedUpdates = [
        'headline', 'bio', 'skills', 'serviceCategories', 'experienceYears', 'experienceStartDate',
        'governorate', 'city', 'address', 'latitude', 'longitude', 'serviceRadiusKm',
        'phone', 'whatsapp', 'email', 'preferredContactMethod', 'availability',
        'certifications', 'portfolioImages', 'cvLink'
      ];

      const newProfile = { ...currentProfile };
      allowedUpdates.forEach(key => {
        if (req.body[key] !== undefined) {
          newProfile[key] = req.body[key];
        }
      });

      await User.updateOne({ id: req.user.id }).set({
        technicianProfile: newProfile
      });

      return res.json({
        message: 'Technician profile updated successfully',
        technicianProfile: newProfile
      });
    } catch (err) {
      sails.log.error('Update technician profile error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
   * GET /api/users/technician/applications
   * List pending applications (Super Admin only)
   */
  getTechnicianApplications: async function (req, res) {
    try {
      const applications = await User.find({ technicianStatus: 'pending' })
        .sort('updatedAt DESC');
      return res.json(applications.map(sanitizeUser));
    } catch (err) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
   * PUT /api/users/:id/technician/approve
   * Approve technician application (Super Admin only)
   */
  approveTechnician: async function (req, res) {
    try {
      const targetUser = await User.findOne({ id: req.params.id });
      if (!targetUser) {return res.status(404).json({ message: 'User not found' });}

      const profile = targetUser.technicianProfile || {};
      profile.reviewedBy = req.user.id;
      profile.reviewedAt = Date.now();
      profile.rejectionReason = null;

      await User.updateOne({ id: req.params.id }).set({
        isTechnician: true,
        technicianStatus: 'approved',
        technicianProfile: profile
      });

      await logAction(req, {
        action: 'technician.application_approved',
        target: targetUser.id,
        targetType: 'User',
        targetLabel: targetUser.name || targetUser.email
      });

      return res.json({ 
        message: 'Technician application approved successfully',
        user: { id: targetUser.id, isTechnician: true, technicianStatus: 'approved' }
      });
    } catch (err) {
      sails.log.error('Approve technician error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
   * PUT /api/users/:id/technician/reject
   * Reject technician application (Super Admin only)
   */
  rejectTechnician: async function (req, res) {
    try {
      const { rejectionReason } = req.body;
      if (!rejectionReason) {
        return res.status(400).json({ message: 'Rejection reason is required' });
      }

      const targetUser = await User.findOne({ id: req.params.id });
      if (!targetUser) {return res.status(404).json({ message: 'User not found' });}

      const profile = targetUser.technicianProfile || {};
      profile.reviewedBy = req.user.id;
      profile.reviewedAt = Date.now();
      profile.rejectionReason = rejectionReason;

      await User.updateOne({ id: req.params.id }).set({
        isTechnician: false,
        technicianStatus: 'rejected',
        technicianProfile: profile
      });

      await logAction(req, {
        action: 'technician.application_rejected',
        target: targetUser.id,
        targetType: 'User',
        targetLabel: targetUser.name || targetUser.email,
        details: { rejectionReason }
      });

      return res.json({ 
        message: 'Technician application rejected',
        user: { id: targetUser.id, isTechnician: false, technicianStatus: 'rejected' }
      });
    } catch (err) {
      sails.log.error('Reject technician error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
   * GET /api/users/technicians/public
   * Get list of approved technicians for public map/list
   */
  getPublicTechnicians: async function (req, res) {
    sails.log.info('GET /api/public-technicians triggered');
    try {
      const technicians = await User.find({
        where: { technicianStatus: 'approved' },
        select: ['id', 'name', 'avatar', 'technicianProfile', 'createdAt']
      });

      sails.log.info(`Found ${technicians.length} approved technicians`);

      const sanitized = technicians.map(tech => ({
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

      return res.json(sanitized);
    } catch (err) {
      sails.log.error('Get public technicians error:', err);
      return res.status(500).json({ message: 'Internal server error', error: err.message });
    }
  }

};
