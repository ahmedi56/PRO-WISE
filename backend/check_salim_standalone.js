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
    const users = await User.find().populate('role');
    console.log('Total users in database:', users.length);
    users.forEach(u => {
      console.log(`- ID: ${u.id}, Name: ${u.name || u.username}, Email: ${u.email}, Role: ${u.role ? u.role.name : 'none'}, isTechnician: ${u.isTechnician}, technicianStatus: ${u.technicianStatus}`);
    });
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
});
