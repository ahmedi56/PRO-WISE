require('dotenv').config();
const Sails = require('sails').constructor;
const mySailsApp = new Sails();

mySailsApp.load({
  hooks: { grunt: false, views: false, pubsub: false, session: false, http: false },
  log: { level: 'info' }
}, async (err) => {
  if (err) {
    console.error('Failed to load Sails:', err);
    process.exit(1);
  }

  console.log('\n--- Testing GeminiService with Retries ---');
  
  try {
    const result = await sails.services.geminiservice.generateText('Hello! Can you reply in exactly 5 words?');
    console.log('\n[Result]:', result);
  } catch (e) {
    console.error('\n[Fatal Error]:', e.message);
  }

  mySailsApp.lower();
});
