/**
 * migrate-technicians.js
 * 
 * Usage: sails run migrate-technicians
 * 
 * This script finds all users with the 'technician' role and:
 * 1. Sets isTechnician = true
 * 2. Sets technicianStatus = 'approved'
 * 3. Initializes a basic technicianProfile if missing
 * 4. Resets their role to 'user' (optional, but recommended to fully transition)
 */

module.exports = {
  friendlyName: 'Migrate technicians',
  description: 'Migrate users from role-based technician to status-based technician.',

  fn: async function () {
    sails.log('Starting technician migration...');

    try {
      // 1. Find the technician role ID
      const techRole = await Role.findOne({ name: 'technician' });
      if (!techRole) {
        sails.log('No technician role found. Nothing to migrate.');
        return;
      }

      // 2. Find the user role ID (to reset them to)
      let userRole = await Role.findOne({ name: 'user' });
      if (!userRole) {
        // Fallback to client if user not found
        userRole = await Role.findOne({ name: 'client' });
      }

      if (!userRole) {
        sails.log.error('Could not find a standard user/client role to reset technicians to.');
        return;
      }

      // 3. Find all users with techRole
      const techs = await User.find({ role: techRole.id });
      sails.log(`Found ${techs.length} users with technician role.`);

      let migratedCount = 0;

      for (const tech of techs) {
        const profile = tech.technicianProfile || {
          headline: 'Migrated Technician',
          bio: 'This profile was migrated from the legacy role-based system.',
          skills: ['General Repair'],
          experienceYears: 1,
          city: 'Unknown',
          governorate: 'Unknown',
          serviceCategories: ['General'],
          phone: tech.phone || '',
          whatsapp: '',
          availability: {
            weekdays: true,
            weekends: false,
            morning: true,
            afternoon: true,
            evening: false,
            emergencyAvailable: false
          }
        };

        await User.updateOne({ id: tech.id }).set({
          isTechnician: true,
          technicianStatus: 'approved',
          technicianProfile: profile,
          role: userRole.id // Reset role to standard user
        });

        migratedCount++;
      }

      sails.log(`Successfully migrated ${migratedCount} technicians.`);
      sails.log('Migration complete.');
    } catch (err) {
      sails.log.error('Migration failed:', err);
    }
  }
};
