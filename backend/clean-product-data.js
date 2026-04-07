/**
 * clean-product-data.js
 * 
 * Standalone reset script to clean up all product-related data.
 */
require('dotenv').config();
const sails = require('sails');
const rc = require('sails/accessible/rc');

async function run() {
  console.log('--- Cleaning Product-Related Data ---');
  
  const config = rc('sails');
  config.hooks = config.hooks || {};
  config.hooks.orm = require('sails-hook-orm');
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
    const db = sails.getDatastore().manager;
    
    console.log('Environment loaded. Deleting orphaned product data...\n');
    
    // We will use native driver to delete these efficiently and without cascade constraint issues
    const collectionsToClean = [
      'product',     // ensure products are gone
      'guide',       // repair guides
      'step',        // steps for guides
      'media',       // media (videos/images)
      'qrcode',      // qr codes
      'category',    // categories
      'guidetype'    // guide types
    ];
    
    for (const collName of collectionsToClean) {
      try {
        const result = await db.collection(collName).deleteMany({});
        console.log(`Deleted ${result.deletedCount || 0} documents from [${collName}]`);
      } catch (err) {
         console.log(`Skipped [${collName}] or error: ${err.message}`);
      }
    }
    
    console.log('\n--- SUCCESS ---');
    console.log('All product and related support content data has been reset.');
    
  } catch (err) {
    console.error('Reset failed:', err);
  } finally {
    sails.lower(() => process.exit(0));
  }
}

run();
