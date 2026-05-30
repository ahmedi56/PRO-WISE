const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  const models = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-pro'];
  
  for (const m of models) {
    console.log(`Testing ${m}...`);
    try {
      const model = genAI.getGenerativeModel({ model: m });
      await model.generateContent('Hi');
      console.log(`  [✓] ${m} works!`);
    } catch (err) {
      console.log(`  [✗] ${m} failed: ${err.message}`);
    }
  }
}

test();
