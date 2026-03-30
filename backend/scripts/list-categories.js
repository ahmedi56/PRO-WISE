const path = require('path');
const sails = require('sails');

sails.lift({
  appPath: path.join(__dirname, '..'),
  hooks: { grunt: false },
  log: { level: 'error' }
}, async (err) => {
  if (err) {
    console.error('Failed to lift Sails:', err);
    process.exit(1);
  }

  try {
    const Category = sails.models.category;
    const categories = await Category.find();
    
    console.log('--- CATEGORIES IN DB ---');
    categories.forEach(cat => {
      console.log(`ID: ${cat.id} | Name: ${cat.name} | Parent: ${cat.parent} | Icon: ${cat.icon} | Level: ${cat.level}`);
    });

    sails.lower(() => process.exit(0));
  } catch (err) {
    console.error('Error querying categories:', err);
    sails.lower(() => process.exit(1));
  }
});
