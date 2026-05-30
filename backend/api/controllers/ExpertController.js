/**
 * ExpertController
 *
 * @description :: Server-side actions for public technician/expert discovery.
 */

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) {return null;}
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const sanitizeUser = (user) => _.omit(user, ['password', 'resetPasswordToken', 'resetPasswordExpires']);

module.exports = {

  /**
   * GET /api/experts
   * List approved technicians with filtering and distance calculation
   */
  list: async function (req, res) {
    try {
      const { specialization, minRating, emergencyOnly, verifiedOnly, lat, lng } = req.query;

      const query = {
        isTechnician: true,
        technicianStatus: 'approved'
      };

      const technicians = await User.find(query).populate('role');

      // Manual filtering for complex nested logic
      const filtered = technicians.filter(tech => {
        const profile = tech.technicianProfile || {};
        
        if (verifiedOnly === 'true' && profile.verificationLevel === 'Basic') {return false;}
        if (emergencyOnly === 'true' && !profile.emergencyAvailable) {return false;}
        if (minRating && (profile.averageRating || 0) < parseFloat(minRating)) {return false;}
        
        if (specialization) {
          const specLower = specialization.toLowerCase();
          const hasSpec = profile.specializations?.some(s => s.name.toLowerCase().includes(specLower)) ||
                         profile.skills?.some(s => s.toLowerCase().includes(specLower));
          if (!hasSpec) {return false;}
        }

        return true;
      });

      // Transform and calculate distance
      const result = filtered.map(tech => {
        const profile = tech.technicianProfile || {};
        const distance = calculateDistance(
          parseFloat(lat), parseFloat(lng),
          profile.latitude, profile.longitude
        );

        return {
          id: tech.id,
          name: tech.name,
          avatar: tech.avatar,
          headline: profile.headline,
          bio: profile.bio,
          city: profile.city,
          governorate: profile.governorate,
          latitude: profile.latitude,
          longitude: profile.longitude,
          averageRating: profile.averageRating || 0,
          completedJobs: profile.completedJobs || 0,
          joinedAt: tech.createdAt,
          topExpertBadge: profile.topExpertBadge || false,
          verificationLevel: profile.verificationLevel || 'Basic',
          emergencyAvailable: profile.emergencyAvailable || false,
          distanceKm: distance,
          specializations: profile.specializations || [],
          skills: profile.skills || []
        };
      });

      // Sort by distance if lat/lng provided
      if (lat && lng) {
        result.sort((a, b) => (a.distanceKm || Infinity) - (b.distanceKm || Infinity));
      }

      return ResponseService.success(res, result);
    } catch (err) {
      return ResponseService.error(res, 'Error fetching experts', 500, 'EXPERT_FETCH_ERROR', err);
    }
  },

  /**
   * GET /api/experts/:id
   * Get detailed public profile for a single expert
   */
  getOne: async function (req, res) {
    try {
      const technician = await User.findOne({
        id: req.params.id,
        isTechnician: true,
        technicianStatus: 'approved'
      }).populate('role');

      if (!technician) {
        return ResponseService.notFound(res, 'Expert not found');
      }

      const profile = technician.technicianProfile || {};
      const sanitized = sanitizeUser(technician);
      
      // Ensure numeric defaults for frontend safety
      sanitized.technicianProfile = {
        ...profile,
        averageRating: profile.averageRating || 0,
        completedJobs: profile.completedJobs || 0
      };

      return ResponseService.success(res, sanitized);
    } catch (err) {
      return ResponseService.error(res, 'Error fetching expert profile', 500, 'EXPERT_PROFILE_ERROR', err);
    }
  }

};
