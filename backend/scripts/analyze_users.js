module.exports = {
  friendlyName: 'Analyze Users',
  description: 'Count users by role and get platform statistics.',
  fn: async function () {
    const User = sails.models.user;
    const Role = sails.models.role;

    const roles = await Role.find();
    const stats = [];

    for (const role of roles) {
      const count = await User.count({ role: role.id });
      stats.push({ name: role.name, count });
    }

    // Also count total companies
    const companyCount = await sails.models.company.count();

    console.log('--- USER ANALYSIS DATA ---');
    console.log(JSON.stringify({ stats, companyCount }, null, 2));
  }
};
