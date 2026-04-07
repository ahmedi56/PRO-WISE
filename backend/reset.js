/**
 * reset.js
 * 
 * Standalone database reset script for PRO-WISE.
 * Usage: node reset.js
 */

const sails = require('sails');

async function runReset() {
  console.log('--- Database Reset Initializing ---');

  try {
    // 1. Boot Sails (Headless mode, no server)
    await new Promise((resolve, reject) => {
      sails.load({
        hooks: { grunt: false, views: false, sockets: false, pubsub: false, http: false },
        log: { level: 'error' }
      }, (err) => {
        if (err) {return reject(err);}
        resolve();
      });
    });

    console.log('Environment loaded successfully.');

    // 2. Identify Super Admin Role
    const superAdminRole = await sails.models.role.findOne({ name: 'super_admin' });
    if (!superAdminRole) {
      console.error('CRITICAL ERROR: "super_admin" role not found in database.');
      console.log('Reset aborted to prevent accidental data loss.');
      process.exit(1);
    }

    const superAdminId = superAdminRole.id;
    console.log(`Verified super_admin role (ID: ${superAdminId})`);

    // 3. DELETE USERS (SAFE: Keep super_admin)
    // We delete everyone whose role is NOT super_admin
    const deletedUsers = await sails.models.user.destroy({
      role: { '!=': superAdminId }
    }).fetch();

    // 4. DELETE PRODUCTS (ALL)
    const deletedProducts = await sails.models.product.destroy({}).fetch();

    // 5. Final Reporting
    console.log('\n--- SUCCESS ---');
    console.log(`Deleted ${deletedUsers.length} users (kept super_admin)`);
    console.log(`Deleted ${deletedProducts.length} products`);
    console.log('Database reset completed successfully');
    console.log('-------------------------------\n');

  } catch (err) {
    console.error('An unexpected error occurred during the reset process:');
    console.error(err);
  } finally {
    // Stop Sails and exit
    sails.lower(() => {
      process.exit();
    });
  }
}

// Start the reset process
runReset();
