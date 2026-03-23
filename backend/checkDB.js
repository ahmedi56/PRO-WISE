
async function checkDB() {
  try {
    const roles = await Role.find();
    console.log('Roles in DB:', JSON.stringify(roles, null, 2));

    const users = await User.find().populate('role').populate('company');
    console.log('Users in DB (first 5):', JSON.stringify(users.slice(0, 5), null, 2));

    const products = await Product.find().populate('company');
    console.log('Products in DB (first 5):', JSON.stringify(products.slice(0, 5), null, 2));

    const qrCodes = await QRCode.find();
    console.log('QR Codes in DB:', JSON.stringify(qrCodes, null, 2));

  } catch (err) {
    console.error('Error checking DB:', err);
  }
}

// Sails might not be global in this script context if run via node directly, 
// so we need to lift it or run it via sails console.
// But I'll try to run it as a Sails shell script.
module.exports = checkDB;
