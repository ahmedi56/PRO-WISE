const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const API_KEYS = process.env.OPENROUTER_API_KEYS.split(',');

async function testKey(key, index) {
  console.log(`\n--- Testing Key ${index + 1} ---`);
  // Models to try
  const models = [
    'google/gemini-2.0-flash-exp:free',
    'google/gemma-2-9b-it:free',
    'mistralai/mistral-7b-instruct:free',
    'meta-llama/llama-3.2-3b-instruct:free'
  ];

  for (const model of models) {
    try {
      console.log(`Trying model: ${model}`);
      const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: model,
        messages: [{ role: 'user', content: 'Say "Success"' }],
        max_tokens: 10
      }, {
        headers: {
          'Authorization': `Bearer ${key.trim()}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log(`✅ Success with model ${model}:`, response.data.choices[0].message.content);
      return true;
    } catch (err) {
      const status = err.response ? err.response.status : 'TIMEOUT';
      const msg = err.response?.data?.error?.message || err.message;
      console.log(`❌ Failed with ${model}: [${status}] ${msg}`);
      if (status === 401) {
        console.error('CRITICAL: Key is invalid!');
        return false;
      }
    }
  }
  return false;
}

async function run() {
  for (let i = 0; i < API_KEYS.length; i++) {
    await testKey(API_KEYS[i], i);
  }
}

run();
