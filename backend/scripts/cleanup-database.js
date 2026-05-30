/**
 * cleanup-database.js
 *
 * @description :: Script to normalize roles and clean up inconsistent user data.
 * @usage       :: npx sails run cleanup-database
 */

module.exports = {

  friendlyName: 'Cleanup database',

  description: 'Normalize role names and ensure data consistency for production.',

  fn: async function () {
    sails.log.info('Starting database cleanup...');

    // Access models safely
    const RoleModel = sails.models.role || sails.hooks.orm.models.role;
    const UserModel = sails.models.user || sails.hooks.orm.models.user;

    if (!RoleModel || !UserModel) {
      throw new Error('Could not find Role or User models in sails object.');
    }

    // 1. Ensure core roles exist with correct names
    const coreRoles = ['super_admin', 'company_admin', 'technician', 'user'];
    for (const name of coreRoles) {
      await RoleModel.findOrCreate({ name }, { name });
    }

    const roles = await RoleModel.find();
    const roleMap = _.keyBy(roles, 'name');

    // 2. Normalize User roles and statuses
    const users = await UserModel.find().populate('role');
    sails.log.info(`Processing ${users.length} users...`);

    let updatedCount = 0;
    for (const user of users) {
      const updates = {};
      const currentRoleName = user.role ? user.role.name : '';

      // Normalize role
      if (['superadmin', 'super-admin'].includes(currentRoleName)) {
        updates.role = roleMap['super_admin'].id;
      } else if (currentRoleName === 'administrator') {
        updates.role = roleMap['company_admin'].id;
      } else if (['client', 'customer'].includes(currentRoleName)) {
        updates.role = roleMap['user'].id;
      }

      // Ensure technician status consistency
      if (user.isTechnician && !user.technicianStatus) {
        updates.technicianStatus = 'approved';
      }

      // Ensure email is lowercase
      if (user.email && user.email !== user.email.toLowerCase()) {
        updates.email = user.email.toLowerCase();
      }

      if (Object.keys(updates).length > 0) {
        await UserModel.updateOne({ id: user.id }).set(updates);
        updatedCount++;
      }
    }

    sails.log.info(`Cleanup complete. Updated ${updatedCount} users.`);
  }

};
