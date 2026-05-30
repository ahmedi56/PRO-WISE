const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testAll() {
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  const models = [
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-pro-latest',
    'gemini-1.5-flash-latest'
  ];
  
  for (const m of models) {
    console.log(`Testing ${m}...`);
    try {
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent('Hi');
      console.log(`  [✓] ${m} works! Response: ${result.response.text().substring(0, 20)}`);
      process.exit(0); // Exit on first success
    } catch (err) {
      console.log(`  [✗] ${m} failed: ${err.message}`);
    }
  }
}

testAll();
