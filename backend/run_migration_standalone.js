const sails = require('sails');

const config = {
  hooks: { 
    grunt: false, 
    views: false, 
    pubsub: false, 
    session: false,
    blueprints: false,
    orm: require('sails-hook-orm'),
    sockets: require('sails-hook-sockets')
  },
  log: { level: 'silent' }
};

sails.lift(config, async (err) => {
  if (err) {
    console.error('Sails lift error:', err);
    process.exit(1);
  }
  try {
    console.log('Starting standalone technician migration...');
    const techRole = await Role.findOne({ name: 'technician' });
    if (!techRole) {
      console.log('No technician role found. Nothing to migrate.');
      process.exit(0);
    }

    let userRole = await Role.findOne({ name: 'user' });
    if (!userRole) {
      userRole = await Role.findOne({ name: 'client' });
    }

    if (!userRole) {
      console.error('Could not find user/client role.');
      process.exit(1);
    }

    // Find ALL users with role technician
    const techs = await User.find({ role: techRole.id });
    console.log(`Found ${techs.length} users with technician role in DB.`);

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

      console.log(`Migrated user: ${tech.name || tech.username} (${tech.email})`);
      migratedCount++;
    }

    // Also migrate users who have role 'user' but are technicians in status but don't have isTechnician = true
    const statusTechs = await User.find({ technicianStatus: 'approved', isTechnician: { '!=': true } });
    for (const t of statusTechs) {
      await User.updateOne({ id: t.id }).set({ isTechnician: true });
      console.log(`Updated isTechnician to true for: ${t.name || t.username}`);
      migratedCount++;
    }

    console.log(`Successfully migrated ${migratedCount} records.`);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
});
