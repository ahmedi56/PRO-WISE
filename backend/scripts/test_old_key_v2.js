const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  const apiKey = 'AIzaSyCbQZ3Y5pVx8rv8vkT3LUYMPg026rdQp70';
  const genAI = new GoogleGenerativeAI(apiKey);
  const models = ['gemini-1.5-flash', 'gemini-pro'];
  
  for (const m of models) {
    console.log(`Testing ${m} with OLD key...`);
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
