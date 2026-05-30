/**
 * TechnicianController
 *
 * @description :: Actions for technician applications and profile management.
 */


module.exports = {

  /**
   * POST /api/technician/apply
   * Submit technician application
   */
  apply: async function (req, res) {
    try {
      const user = await User.findOne({ id: req.user.id }).populate('role');
      if (!user) {return ResponseService.notFound(res, 'User not found');}

      const roleName = (user.role && user.role.name ? user.role.name : '').toLowerCase();
      
      if (user.technicianStatus === 'approved') {
        return ResponseService.badRequest(res, 'You are already an approved technician');
      }

      if (['administrator', 'company_admin', 'super_admin'].includes(roleName)) {
        return ResponseService.forbidden(res, 'Administrators cannot become technicians');
      }

      const {
        headline, bio, city, governorate, latitude, longitude, phone,
        specializations, certifications, serviceRadiusKm, emergencyAvailable, portfolioImages
      } = req.body;

      if (!headline || !bio || !city || !governorate || !phone) {
        return ResponseService.badRequest(res, 'Core identity fields are required');
      }

      const profile = {
        headline, bio, city, governorate,
        latitude: latitude || null,
        longitude: longitude || null,
        phone,
        specializations: specializations || [],
        certifications: (certifications || []).map(c => ({ ...c, verificationStatus: 'pending' })),
        serviceRadiusKm: serviceRadiusKm || 20,
        emergencyAvailable: emergencyAvailable || false,
        portfolioImages: portfolioImages || [],
        completedJobs: 0,
        averageRating: 0,
        verificationLevel: 'Basic',
        skills: (specializations || []).map(s => s.name)
      };

      await User.updateOne({ id: req.user.id }).set({
        technicianStatus: 'pending',
        technicianProfile: profile
      });

      // Notify Super Admins
      if (sails.services.notificationservice) {
        await sails.services.notificationservice.notifySuperAdmins({
          title: 'New Technician Application',
          message: `${user.name} has applied to become a technician.`,
          type: 'warning',
          link: '/admin/technician-applications'
        });
      }

      return ResponseService.success(res, { status: 'pending' }, 'Application submitted successfully');
    } catch (err) {
      return ResponseService.error(res, 'Failed to submit application', 500, 'APPLICATION_ERROR', err);
    }
  },

  /**
   * GET /api/technician/me
   */
  me: async function (req, res) {
    try {
      const user = await User.findOne({ id: req.user.id });
      return ResponseService.success(res, {
        isTechnician: user.isTechnician,
        technicianStatus: user.technicianStatus,
        technicianProfile: user.technicianProfile
      });
    } catch (err) {
      return ResponseService.error(res, 'Failed to fetch status', 500, 'TECH_ME_ERROR', err);
    }
  },

  /**
   * PUT /api/technician/profile
   */
  updateProfile: async function (req, res) {
    try {
      const user = await User.findOne({ id: req.user.id });
      if (!user.isTechnician || user.technicianStatus !== 'approved') {
        return ResponseService.forbidden(res, 'Only approved technicians can edit their profile');
      }

      const updatedProfile = { ...user.technicianProfile, ...req.body };
      
      // Protect sensitive fields from being edited by technician themselves
      delete updatedProfile.verificationLevel;
      delete updatedProfile.topExpertBadge;
      delete updatedProfile.averageRating;
      delete updatedProfile.completedJobs;

      await User.updateOne({ id: req.user.id }).set({ technicianProfile: updatedProfile });
      return ResponseService.success(res, updatedProfile, 'Technician profile updated');
    } catch (err) {
      return ResponseService.error(res, 'Failed to update profile', 500, 'TECH_UPDATE_ERROR', err);
    }
  }

};
