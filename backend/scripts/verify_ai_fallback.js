require('dotenv').config();
/**
 * Purpose: Verifies AI provider health and validates the fallback logic.
 * Priority: Groq (Fast) -> Colab (Local) -> Gemini (Fallback)
 */

async function test() {
  console.log('🚀 Starting AI Priority Verification...');
  console.log('-------------------------------------------');

  try {
    // 1. Check Availability
    const colabOk = sails.services.grokservice ? await sails.services.colabservice.isAvailable() : false;
    const groqOk = sails.services.grokservice ? await sails.services.grokservice.isAvailable() : false;
    const geminiOk = sails.services.geminiservice ? await sails.services.geminiservice.isAvailable() : false;

    console.log('📡 Status Check:');
    console.log(`   - Colab (Local): ${colabOk ? '✅ Available' : '❌ Offline'}`);
    console.log(`   - Groq (Fast):  ${groqOk ? '✅ Available' : '❌ Offline'}`);
    console.log(`   - Gemini (Fallback): ${geminiOk ? '✅ Available' : '❌ Offline'}`);
    console.log('-------------------------------------------');

    // 2. Run Test Generation
    console.log('🤖 Triggering AI Orchestrator (Natural Priority: Groq first)...');
    const startTime = Date.now();
    
    const result = await sails.services.aigenerationservice.generateText('Say "Priority Check Successful" and tell me your name.');
    
    const duration = Date.now() - startTime;

    if (result.success) {
      console.log('✨ SUCCESS!');
      console.log(`⏱️  Response Time: ${duration}ms`);
      console.log(`🏆 Winner: ${result.metadata?.model || 'Unknown'}`);
      console.log(`📝 Response: "${result.data}"`);
    } else {
      console.log('❌ FAILED:', result.message);
    }

  } catch (err) {
    console.error('💥 Unexpected Error during test:', err);
  }
}

module.exports = {
  friendlyName: 'Verify AI Priority',
  fn: test
};
