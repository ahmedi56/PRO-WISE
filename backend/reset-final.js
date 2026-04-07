/**
 * reset-final.js
 * 
 * Standalone reset script that bypasses hook discovery issues.
 */
require('dotenv').config();
const sails = require('sails');
const rc = require('sails/accessible/rc');

async function run() {
  console.log('--- Final Reset Attempt: Booting Environment ---');
  
  const config = rc('sails');
  config.hooks = config.hooks || {};
  config.hooks.orm = require('sails-hook-orm');
  // Disable heavy hooks for a fast script
  config.hooks.sockets = false;
  config.hooks.pubsub = false;
  config.hooks.views = false;
  config.hooks.grunt = false;
  config.hooks.http = false;

  await new Promise((resolve, reject) => {
    sails.load(config, (err) => {
      if (err) {return reject(err);}
      resolve();
    });
  });

  try {
    console.log('Environment loaded. Identifying Super Admin...');
    
    // Check all databases first
    const adminDb = sails.getDatastore().manager.admin();
    const dbs = await adminDb.listDatabases();
    console.log('Available Databases:', dbs.databases.map(d => d.name));
    
    // Scan UserDB for products
    const userDb = sails.getDatastore().manager.client.db('UserDB');
    const userCollections = await userDb.listCollections().toArray();
    console.log('\nUserDB Collections:', userCollections.map(c => c.name));
    for (const coll of userCollections) {
      const count = await userDb.collection(coll.name).countDocuments();
      console.log(`UserDB [${coll.name}]: ${count} documents`);
    }
    
    // Scan universite for products
    const uniDb = sails.getDatastore().manager.client.db('universite');
    const uniCollections = await uniDb.listCollections().toArray();
    console.log('\nuniversite Collections:', uniCollections.map(c => c.name));
    for (const coll of uniCollections) {
      const count = await uniDb.collection(coll.name).countDocuments();
      console.log(`universite [${coll.name}]: ${count} documents`);
    }
    
    console.log('\nCurrent Datastore URL:', sails.config.datastores.default.url);
    
    // Use sails.models explicitly
    const Role = sails.models.role;
    const User = sails.models.user;
    const Product = sails.models.product;
    
    const superAdminRole = await Role.findOne({ name: 'super_admin' });
    if (!superAdminRole) {
      console.error('ERROR: super_admin role not found.');
      process.exit(1);
    }

    console.log('Role found. Deleting users...');
    const deletedUsers = await User.destroy({ role: { '!=': superAdminRole.id } }).fetch();
    
    console.log('Deleting products (using native MongoDB driver to bypass Waterline cascade)...');
    
    // In Sails 1.x with sails-mongo, sails.getDatastore().manager is the native DB connection
    const collections = await sails.getDatastore().manager.listCollections().toArray();
    console.log('Existing collections:', collections.map(c => c.name));
    
    for (const coll of collections) {
      const count = await sails.getDatastore().manager.collection(coll.name).countDocuments();
      console.log(`Collection [${coll.name}]: ${count} documents`);
    }
    
    const sampleGuide = await sails.getDatastore().manager.collection('guide').findOne({});
    console.log('\nSample Guide Data:', JSON.stringify(sampleGuide, null, 2));
    
    const latestAudit = await sails.getDatastore().manager.collection('auditlog').find({}).sort({ createdAt: -1 }).limit(5).toArray();
    console.log('\nLatest Audit Logs:', JSON.stringify(latestAudit, null, 2));

    const sampleQR = await sails.getDatastore().manager.collection('qrcode').findOne({});
    console.log('\nSample QRCode Data:', JSON.stringify(sampleQR, null, 2));

    const productCountFinal = await sails.getDatastore().manager.collection('product').countDocuments();
    console.log(`\nDeleting products from [product] (Found ${productCountFinal})...`);
    
    const result = await sails.getDatastore().manager.collection('product').deleteMany({});
    
    const deletedProductsCount = result.deletedCount || 0;

    console.log('\n--- SUCCESS ---');
    console.log(`Deleted ${deletedUsers.length} users (kept super_admin)`);
    console.log(`Deleted ${deletedProductsCount} products`);
    console.log('Database reset completed successfully');
    
  } catch (err) {
    console.error('Reset failed:', err);
  } finally {
    sails.lower(() => process.exit(0));
  }
}

run();
