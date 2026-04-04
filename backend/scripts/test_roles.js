module.exports = {
  fn: async function () {
    const Role = sails.models.role;
    const superAdmin = await Role.findOne({ name: 'super_admin' });
    const companyAdmin = await Role.findOne({ name: 'company_admin' });

    console.log('--- Role Verification ---');
    console.log('Super Admin Permissions:', superAdmin?.permissions);
    console.log('Company Admin Permissions:', companyAdmin?.permissions);

    if (superAdmin && superAdmin.permissions.includes('products.manage')) {
      console.error('FAIL: Super Admin still has products.manage');
    } else {
      console.log('PASS: Super Admin stripped of products.manage');
    }

    if (companyAdmin && companyAdmin.permissions.includes('qr.generate')) {
      console.log('PASS: Company Admin has qr.generate');
    } else {
      console.error('FAIL: Company Admin missing qr.generate');
    }
  }
};
