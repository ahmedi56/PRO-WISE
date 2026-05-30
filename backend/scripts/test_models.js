const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    console.error('Missing API key');
    return;
  }
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // There is no direct listModels in the client, we have to use the API directly or check documentation.
    // However, we can try to hit a known model and see if it works.
    console.log('Testing gemini-pro...');
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent('Hi');
    console.log('gemini-pro works:', result.response.text());
  } catch (err) {
    console.error('gemini-pro failed:', err.message);
  }
}

listModels();
