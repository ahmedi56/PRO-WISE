const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function analyze() {
  if (!process.env.GOOGLE_AI_API_KEY) {
    console.error('Missing GOOGLE_AI_API_KEY in .env');
    return;
  }
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

  const imagePath = path.join(__dirname, '../web/public/pro-wise.png');
  if (!fs.existsSync(imagePath)) {
    console.error('Image file not found:', imagePath);
    return;
  }

  const imageData = fs.readFileSync(imagePath);
  const imagePart = {
    inlineData: {
      data: imageData.toString('base64'),
      mimeType: 'image/png'
    }
  };

  const prompt = `Please describe this logo in EXTREME detail. 
I need to recreate it as an SVG.
1. What exact object(s), geometry, or symbols are visible? List their shapes.
2. Are there any intertwined lines, infinity signs, or Datacamp-like geometric patterns?
3. How are the elements arranged spatially?
4. Are there any specific letters (like 'P' or 'W') or is it purely abstract?
5. Describe the colors (though I know to swap them to Cyber Blue later). Provide layout proportions.`;

  try {
    const result = await model.generateContent([prompt, imagePart]);
    console.log('--- LOGO DESCRIPTION ---');
    console.log(result.response.text());
  } catch (err) {
    console.error('Error analyzing image:', err.message);
  }
}

analyze();
