
const sails = require('sails');

sails.lift({
  hooks: { grunt: false },
  log: { level: 'error' }
}, async (err) => {
  if (err) {
    console.error('Failed to lift Sails:', err);
    process.exit(1);
  }

  try {
    const roles = await Role.find();
    console.log('--- ROLES ---');
    console.log(JSON.stringify(roles, null, 2));

    const users = await User.find().populate('role').populate('company');
    console.log('--- USERS ---');
    console.log(JSON.stringify(users.map(u => ({
        id: u.id,
        email: u.email,
        role: u.role ? u.role.name : 'none',
        company: u.company ? u.company.name : 'none',
        status: u.status
    })), null, 2));

    const companies = await Company.find();
    console.log('--- COMPANIES ---');
    console.log(JSON.stringify(companies, null, 2));

    const products = await Product.find().populate('company');
    console.log('--- PRODUCTS ---');
    console.log(JSON.stringify(products.map(p => ({
        id: p.id,
        name: p.name,
        company: p.company ? p.company.name : 'none',
        status: p.status
    })), null, 2));

    process.exit(0);
  } catch (err) {
    console.error('Error checking DB:', err);
    process.exit(1);
  }
});
