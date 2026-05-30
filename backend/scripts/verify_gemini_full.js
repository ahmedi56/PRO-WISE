const Sails = require('sails').constructor;
const mySailsApp = new Sails();
require('dotenv').config();

mySailsApp.load({
  hooks: { grunt: false, views: false, pubsub: false, session: false, http: false },
  log: { level: 'error' }
}, async (err) => {
  if (err) { process.exit(1); }

  console.log('\n--- Comprehensive Gemini Functionality Check ---');
  
  const GeminiService = sails.services.geminiservice;
  if (!GeminiService || !GeminiService.isAvailable()) {
    console.error('❌ GeminiService not available or API key missing.');
    process.exit(1);
  }

  try {
    // 1. Test Text Generation (Instructions)
    console.log('\n1. Testing Text Generation (Build Instructions)...');
    const textRes = await GeminiService.generateText('Write a 1-sentence instruction on how to open a laptop.');
    if (textRes.success) {
      console.log('   ✅ SUCCESS:', textRes.data);
    } else {
      console.log('   ❌ FAILED:', textRes.message);
    }

    // 2. Test JSON Generation (Semantic Ranking)
    console.log('\n2. Testing JSON Generation (Search Ranking)...');
    const jsonRes = await GeminiService.generateText('List 3 computer parts as a JSON array of strings.', {
      responseMimeType: 'application/json'
    });
    if (jsonRes.success) {
      console.log('   ✅ SUCCESS:', jsonRes.data);
    } else {
      console.log('   ❌ FAILED:', jsonRes.message);
    }

    // 3. Test Embeddings (Related Products)
    console.log('\n3. Testing Embeddings (Similarity)...');
    const embedRes = await GeminiService.getEmbedding('Laptop battery replacement');
    if (embedRes.success) {
      console.log('   ✅ SUCCESS: Received embedding vector of length', embedRes.embedding.length);
    } else {
      console.log('   ❌ FAILED:', embedRes.message);
    }

    console.log('\n--- Check Complete ---');

  } catch (e) {
    console.error('\n[Fatal Error]:', e.message);
  }

  mySailsApp.lower();
});
