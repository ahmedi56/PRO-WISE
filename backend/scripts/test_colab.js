const sails = require('sails');

// Start sails temporarily to test the AI service
sails.lift({ log: { level: 'info' } }, async (err) => {
  if (err) {
    console.error('Failed to lift Sails:', err);
    return process.exit(1);
  }

  try {
    console.log('\n--- TESTING AI FALLBACK PIPELINE ---');
    
    const AIGenerationService = sails.services.aigenerationservice || sails.services.AIGenerationService;
    
    console.log('AI Enabled?', AIGenerationService._isAIEnabled());
    
    console.log('\nSending test prompt...');
    const result = await AIGenerationService.generateText('Explain the difference between DDR4 and DDR5 RAM in 2 short bullet points.', {
      responseMimeType: 'text/plain',
      maxOutputTokens: 200
    });

    console.log('\n=== RESULT ===');
    console.log(JSON.stringify(result, null, 2));

  } catch (e) {
    console.error('Test failed with error:', e);
  } finally {
    sails.lower(() => {
      process.exit(0);
    });
  }
});
