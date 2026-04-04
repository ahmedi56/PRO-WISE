const sails = require('sails');
sails.load({log: {level: 'warn'}}, async (err) => {
  if (err) { console.error(err); process.exit(1); }
  const Role = sails.models.role;
  const sa = await Role.findOne({name:'super_admin'});
  console.log('Super Admin permissions:', JSON.stringify(sa.permissions, null, 2));
  
  // if missing categories.manage, update it manually as a fallback
  if (!sa.permissions.includes('categories.manage')) {
    console.log('categories.manage permission is missing. Formatting it...');
    const defaultSA = sails.config.custom.defaultRoles.find(r => r.name === 'super_admin');
    await Role.updateOne({name: 'super_admin'}).set({permissions: defaultSA.permissions});
    console.log('super_admin permissions updated to default.');
  }

  sails.lower(() => process.exit(0));
});
