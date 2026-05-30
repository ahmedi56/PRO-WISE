const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function checkKeys() {
    const rawKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY;
    if (!rawKeys) {
        console.error('❌ No API keys found in .env');
        return;
    }

    const keys = rawKeys.split(',').map(k => k.trim()).filter(Boolean);
    console.log(`\n--- Checking ${keys.length} API Key(s) ---\n`);

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const maskedKey = key.substring(0, 8) + '...' + key.substring(key.length - 4);
        console.log(`[${i + 1}/${keys.length}] Testing Key: ${maskedKey}`);

        try {
            const genAI = new GoogleGenerativeAI(key);
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }); 
            
            const start = Date.now();
            const result = await model.generateContent('Say \'Ready\'');
            const response = await result.response;
            const text = response.text();
            
            if (text.toLowerCase().includes('ready')) {
                console.log(`   ✅ FUNCTIONAL (Response time: ${Date.now() - start}ms)`);
            } else {
                console.log(`   ⚠️  UNEXPECTED RESPONSE: ${text}`);
            }
        } catch (err) {
            const msg = err.message || '';
            if (msg.includes('429')) {
                console.log('   ❌ RATE LIMITED (429): Quota exceeded for today.');
            } else if (msg.includes('API_KEY_INVALID') || msg.includes('not found')) {
                console.log('   ❌ INVALID: The key is incorrect or deleted.');
            } else {
                console.log(`   ❌ ERROR: ${msg}`);
            }
        }
    }
    console.log('\n--- Check Complete ---\n');
}

checkKeys();
