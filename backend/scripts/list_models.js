require('dotenv').config();

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('Using Key:', apiKey);
  try {
    // The library doesn't have a direct listModels, so we use the REST API manually but in JS
    const axios = require('axios');
    const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    console.log('Available Models:', response.data.models.map(m => m.name).join(', '));
  } catch (err) {
    console.error('List models failed:', err.response ? err.response.data : err.message);
  }
}

listModels();
