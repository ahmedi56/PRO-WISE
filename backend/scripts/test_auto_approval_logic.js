require('dotenv').config();

module.exports = {
  friendlyName: 'Test Auto Approval Logic',
  fn: async function() {
    console.log('🧪 Testing Auto-Approval Logic (Mock Mode)...');
    console.log('-------------------------------------------');

    const service = sails.services.contentapprovalservice;
    
    if (!service) {
      console.error('❌ Error: ContentApprovalService not found.');
      return;
    }

    // 1. Mock Content (High Quality)
    const mockContent = {
      title: 'Professional Screen Replacement Guide',
      description: 'This is a detailed guide on how to replace a cracked screen on modern smartphones using specialized tools. It covers safety, disassembly, and reassembly.',
      type: 'guide',
      steps: [
        { title: 'Step 1: Power Off', description: 'Ensure the device is completely powered down before starting.' },
        { title: 'Step 2: Remove Screws', description: 'Use a pentalobe screwdriver to remove the two screws at the bottom.' }
      ],
      media: [{ type: 'image', url: 'https://example.com/step1.jpg' }]
    };

    console.log('📝 Testing Rule-Based Scoring...');
    const ruleResult = service.getRuleBasedScore(mockContent);
    console.log(`✅ Rule Score: ${ruleResult.score}/100 (Decision: ${ruleResult.decision})`);

    console.log('\n🤖 Testing AI-Based Analysis (via Groq/Gemini)...');
    const aiResult = await service.analyzeWithAI(mockContent);

    if (aiResult) {
      console.log(`✅ AI Score: ${aiResult.score}/100 (Decision: ${aiResult.decision})`);
      console.log('📝 AI Reasons:');
      aiResult.reasons.forEach(r => console.log(`   - ${r}`));

      // 3. Combined Logic Check
      const combinedScore = Math.round((ruleResult.score * 0.4) + (aiResult.score * 0.6));
      console.log(`\n🏆 Final Combined Score: ${combinedScore}/100`);
      
      let finalDecision = 'manual_review';
      if (combinedScore >= 80) finalDecision = 'approve';
      else if (combinedScore < 40) finalDecision = 'reject';

      console.log(`🏁 Final System Decision: ${finalDecision.toUpperCase()}`);

      if (finalDecision === 'approve') {
        console.log('\n✨ SUCCESS: The logic works and would auto-approve this content!');
      } else {
        console.log('\n⚠️ FLAG: The logic works and would flag this for manual review.');
      }
    } else {
      console.error('❌ AI Analysis failed to return a result.');
    }
    
    console.log('-------------------------------------------');
  }
};
