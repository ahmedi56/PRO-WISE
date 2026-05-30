/**
 * seed-dummy-tech.js
 */
module.exports = {
  friendlyName: 'Seed dummy technician',
  fn: async function () {
    try {
      const userRole = await sails.models.role.findOne({ name: 'user' });
      if (!userRole) {
        console.error('User role not found');
        return;
      }

      const dummy = await sails.models.user.create({
        email: 'expert@example.com',
        password: await sails.helpers.passwords.hashPassword('password123'),
        name: 'Pro Tech Expert',
        isTechnician: true,
        technicianStatus: 'approved',
        role: userRole.id,
        technicianProfile: {
          headline: 'Certified Master Technician',
          bio: 'Expert in all things repair with over 10 years of experience.',
          skills: ['HVAC', 'Plumbing', 'Electrical'],
          experienceYears: 12,
          city: 'Cairo',
          governorate: 'Cairo',
          averageRating: 4.9,
          completedJobs: 154,
          latitude: 30.0444,
          longitude: 31.2357,
          availability: {
            emergencyAvailable: true
          }
        }
      }).fetch();

      console.log('Created dummy technician:', dummy.email);
    } catch (err) {
      if (err.code === 'E_UNIQUE') {
        console.log('Dummy technician already exists.');
      } else {
        console.error(err);
      }
    }
  }
};
