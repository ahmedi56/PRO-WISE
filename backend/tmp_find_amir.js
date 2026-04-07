const sails = require('sails');
sails.load({ logs: { level: 'error' }, hooks: { grunt: false } }, async (err) => {
  if (err) return console.error(err);
  try {
    const user = await sails.models.user.findOne({ email: 'amir@gmail.com' }).populate('company');
    console.log("User details:", user);
    if (!user) {
        console.log("Creating user amir@gmail.com");
    } else {
        const products = await sails.models.product.find({ company: user.company?.id });
        console.log("Existing products for company:", products);
    }
  } catch(e) {
    console.error(e);
  } finally {
    sails.lower();
  }
});
