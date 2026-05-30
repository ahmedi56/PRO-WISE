/**
 * verify_features.js
 * Comprehensive test for Dynamic Build Instructions and Semantic Search Ranking.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
if (!apiKey) {
    console.error('Error: GEMINI_API_KEY is not set in environment.');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const modelName = 'gemini-2.5-flash';

async function testBuildInstruction() {
    console.log(`\n--- Testing Dynamic Build Instruction (${modelName}) ---`);
    const model = genAI.getGenerativeModel({ model: modelName });
    
    const product = { name: 'ASUS TUF Gaming F17', manufacturer: 'ASUS' };
    const components = [
        { name: 'NVIDIA RTX 3050 Laptop GPU' },
        { name: '16GB DDR4 RAM' },
        { name: '512GB NVMe SSD' }
    ];

    const prompt = `
      As a PRO-WISE technical advisor, provide a VERY CONCISE build summary (max 100 words).
      Product: ${product.name} (${product.manufacturer})
      Components (${components.length}): ${components.map(c => c.name).join(', ')}

      GUIDE: Focus on the technical integration and performance synergy between these specific parts.
      Format: Use 3-4 clear bullet points for assembly order and technical synergy.
    `;

    try {
        const result = await model.generateContent(prompt);
        console.log('[✓] Build Instruction Result:');
        console.log(result.response.text());
    } catch (err) {
        console.error('[✗] Build Instruction Error:', err.message);
    }
}

async function testSemanticRanking() {
    console.log(`\n--- Testing Semantic Ranking (${modelName}) ---`);
    const model = genAI.getGenerativeModel({ model: modelName });
    
    const query = 'Gaming laptop with ASUS durability';
    const candidates = [
        { id: '1', name: 'ASUS TUF Gaming F17', manufacturer: 'ASUS', modelNumber: 'F17' },
        { id: '2', name: 'HP Pavilion 15', manufacturer: 'HP', modelNumber: '15-dk' },
        { id: '3', name: 'ASUS ROG Zephyrus G14', manufacturer: 'ASUS', modelNumber: 'G14' }
    ];

    const candidatesText = candidates.map((c, i) => 
        `${i+1}. [${c.id}] ${c.name} (Manufacturer: ${c.manufacturer}, Model: ${c.modelNumber})`
    ).join('\n');

    const prompt = `
      Rank these products by relevance to the query: "${query}"
      Candidates:
      ${candidatesText}
      Return a JSON array: [{ "id": "id", "reason": "why" }]
    `;

    try {
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
        });
        console.log('[✓] Semantic Ranking Result:');
        console.log(result.response.text());
    } catch (err) {
        console.error('[✗] Semantic Ranking Error:', err.message);
    }
}

async function runAll() {
    await testBuildInstruction();
    await testSemanticRanking();
    console.log('\n--- Verification Finished ---');
}

runAll();
