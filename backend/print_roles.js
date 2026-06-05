const sails = require('sails');

const config = {
  hooks: { 
    grunt: false, 
    views: false, 
    pubsub: false, 
    session: false,
    blueprints: false,
    orm: require('sails-hook-orm'),
    sockets: false, // Disable sockets!
    http: false // Disable HTTP server completely!
  },
  log: { level: 'silent' }
};

sails.load(config, async (err) => {
  if (err) {
    console.error('Sails load error:', err);
    process.exit(1);
  }
  try {
    const roles = await Role.find();
    console.log('Roles in DB:');
    roles.forEach(r => {
      console.log(`- ID: ${r.id}, Name: ${r.name}, Permissions: ${JSON.stringify(r.permissions)}`);
    });
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
});
