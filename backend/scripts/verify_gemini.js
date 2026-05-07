/**
 * verify_gemini.js
 * 
 * Simple script to verify that the Gemini integration is working with the NEW configuration.
 * Run with: node scripts/verify_gemini.js
 */

const fs = require('fs');
const path = require('path');

// Try to find .env in both root and current directory
const envPath = fs.existsSync('./.env') ? './.env' : './backend/.env';
require('dotenv').config({ path: envPath });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function verify() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ ERROR: GEMINI_API_KEY is not set in backend/.env');
    process.exit(1);
  }

  console.log('--- Gemini Production-Ready Verification Start ---');
  console.log(`Using API Key: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`);

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 1. Test Text Generation
    const modelName = 'gemini-2.5-flash';
    console.log(`\n1. Testing Text Generation (${modelName})...`);
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Respond with exactly: 'Gemini 2.5 is online and verified.'");
    const response = await result.response;
    console.log(`   [✓] Response: "${response.text().trim()}"`);
    
    if (response.usageMetadata) {
      console.log(`   [i] Usage: ${response.usageMetadata.totalTokenCount} total tokens`);
    }

    // 2. Test Embeddings
    console.log('\n2. Testing Embeddings (gemini-embedding-001)...');
    const embModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
    const embResult = await embModel.embedContent('Test production embedding vector stability');
    const embedding = embResult.embedding;
    console.log(`   [✓] Embedding dimension: ${embedding.values.length} (expected 768 or 3072 depending on version)`);

    console.log('\n--- VERIFICATION SUCCESSFUL [OK] ---');
  } catch (err) {
    console.error('\n--- VERIFICATION FAILED ---');
    console.error('Error:', err.message);
    if (err.message.includes('429')) {
      console.log('TIP: You are hitting quota limits. Wait 60s or switch to a Pay-as-you-go plan.');
    }
    process.exit(1);
  }
}

verify();
