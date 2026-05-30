const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Mock sails
global.sails = {
  log: {
    info: console.log,
    warn: console.warn,
    error: console.error
  }
};

const OpenRouterService = require('../api/services/OpenRouterService');

async function testIntel() {
  console.log('Sending prompt to OpenRouter: "Tell me about Intel i7"');
  
  const result = await OpenRouterService.generateText('Briefly describe Intel i7 processor family.', {
    model: 'meta-llama/llama-3.3-70b-instruct:free', // Trying a slightly bigger free model
    maxOutputTokens: 200
  });

  if (result.success) {
    console.log('\n✅ SUCCESS!');
    console.log('Response:', result.data);
    console.log('\nMetadata:', result.metadata);
  } else {
    console.error('\n❌ FAILED');
    console.error('Error:', result.message);
    
    console.log('\nRetrying with a different model (google/gemma-4-31b-it:free)...');
    const retryResult = await OpenRouterService.generateText('Briefly describe Intel i7 processor family.', {
      model: 'google/gemma-4-31b-it:free'
    });
    
    if (retryResult.success) {
      console.log('\n✅ RETRY SUCCESS!');
      console.log('Response:', retryResult.data);
    } else {
      console.error('\n❌ ALL MODELS FAILED (Likely provider congestion)');
    }
  }
}

testIntel().catch(console.error);
