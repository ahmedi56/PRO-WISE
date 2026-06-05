const Sails = require('sails').constructor;
const mySailsApp = new Sails();
require('dotenv').config();

mySailsApp.load({
  hooks: { grunt: false, views: false, pubsub: false, session: false, http: false },
  log: { level: 'error' }
}, async (err) => {
  if (err) { process.exit(1); }

  console.log('\n--- Fallback Service Verification ---');
  
  const GroqService = sails.services.grokservice;
  if (!GroqService) {
    console.error('❌ GroqService is undefined.');
    process.exit(1);
  }
  
  const isAvailable = GroqService.isAvailable();
  console.log(`GroqService Availability: ${isAvailable ? '✅ Available' : '❌ Not Available'}`);

  if (isAvailable) {
    try {
      console.log('Testing Groq generation...');
      const res = await GroqService.generateText('Respond with exactly: "Groq is online and verified."');
      if (res.success) {
        console.log('   ✅ SUCCESS:', res.data);
      } else {
        console.log('   ❌ FAILED:', res.message);
      }
    } catch (e) {
      console.error('   ❌ FATAL ERROR:', e.message);
    }
  }

  mySailsApp.lower();
});
