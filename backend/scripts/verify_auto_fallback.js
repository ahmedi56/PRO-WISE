const Sails = require('sails').constructor;
const mySailsApp = new Sails();
require('dotenv').config();

mySailsApp.load({
  hooks: { grunt: false, views: false, pubsub: false, session: false, http: false },
  log: { level: 'error' }
}, async (err) => {
  if (err) { process.exit(1); }

  console.log('\n--- Automatic Fallback Verification ---');
  
  const GeminiService = sails.services.geminiservice;
  const GroqService = sails.services.grokservice;

  console.log('Simulating Gemini Key Absence...');
  
  // We can temporarily mock GeminiService.isAvailable to return false
  const originalIsAvailable = GeminiService.isAvailable;
  GeminiService.isAvailable = () => false;

  try {
    console.log('Calling GeminiService.generateText (should fallback to Groq)...');
    const result = await GeminiService.generateText('Respond with exactly: "Fallback worked successfully."');
    
    if (result.success) {
      console.log('   ✅ SUCCESS: Response received!');
      console.log('   [i] Response:', result.data);
      console.log('   [i] Used Model:', result.metadata?.model);
    } else {
      console.log('   ❌ FAILED:', result.message);
    }
  } catch (e) {
    console.error('   ❌ FATAL ERROR:', e.message);
  } finally {
    // Restore
    GeminiService.isAvailable = originalIsAvailable;
  }

  mySailsApp.lower();
});
