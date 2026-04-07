/**
 * reset-db.js
 *
 * A standard Sails shell script to safely reset the database.
 * Usage: npx sails run reset-db
 */

module.exports = {

  friendlyName: 'Reset Database',

  description: 'Safely deletes all Products and non-super-admin Users.',

  inputs: {},

  exits: {
    success: {
      description: 'Database reset completed successfully.',
    },
  },

  fn: async function () {
    sails.log('--- Database Reset Initializing ---');

    // 1. Identify Super Admin Role
    // Using sails.models prefix for maximum compatibility in different shell environments
    const superAdminRole = await sails.models.role.findOne({ name: 'super_admin' });
    if (!superAdminRole) {
      sails.log.error('CRITICAL ERROR: "super_admin" role not found in database.');
      sails.log.warn('Reset aborted to prevent accidental data loss.');
      return;
    }

    const superAdminId = superAdminRole.id;
    sails.log(`Verified super_admin role (ID: ${superAdminId})`);

    // 2. DELETE USERS (SAFE: Keep super_admin)
    const deletedUsers = await sails.models.user.destroy({
      role: { '!=': superAdminId }
    }).fetch();

    // 3. DELETE PRODUCTS (ALL)
    const deletedProducts = await sails.models.product.destroy({}).fetch();

    // 4. Final Reporting
    sails.log('\n--- SUCCESS ---');
    sails.log(`Deleted ${deletedUsers.length} users (kept super_admin)`);
    sails.log(`Deleted ${deletedProducts.length} products`);
    sails.log('Database reset completed successfully');
    sails.log('-------------------------------\n');

  }

};
