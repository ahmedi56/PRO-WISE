/**
 * audit_db.js
 * Optimized audit script.
 */

const Sails = require('sails').constructor;
const mySailsApp = new Sails();

mySailsApp.load({
  hooks: { 
    grunt: false,
    views: false,
    pubsub: false,
    session: false,
    http: false
  },
  log: { level: 'error' },
  globals: { models: true, sails: true }
}, async (err) => {
  if (err) {
    console.error('Failed to load Sails:', err);
    process.exit(1);
  }

  console.log('--- PRO-WISE Database Audit (Direct Load) ---');
  
  try {
    const models = ['RepairGuide', 'SupportVideo', 'SupportPDF', 'Content'];
    
    for (const modelName of models) {
      const Model = mySailsApp.models[modelName.toLowerCase()];
      if (Model) {
        const count = await Model.count();
        console.log(`\n[${modelName}] Total: ${count}`);
        
        const records = await Model.find().limit(1);
        records.forEach(r => {
          console.log(` - ${r.title || r.name || r.id} (${r.id})`);
          if (r.steps) console.log(`   Steps: ${Array.isArray(r.steps) ? r.steps.length : 'JSON'}`);
          if (r.fileUrl) console.log(`   URL: ${r.fileUrl}`);
          if (r.videoId) console.log(`   Video: ${r.videoId}`);
        });
      } else {
        console.log(`\n[${modelName}] Model not found in mySailsApp.models`);
      }
    }
  } catch (e) {
    console.error('Audit Error:', e.message);
  }

  mySailsApp.lower();
});
