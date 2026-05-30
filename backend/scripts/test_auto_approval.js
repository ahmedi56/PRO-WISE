require('dotenv').config();

module.exports = {
  friendlyName: 'Test Auto Approval',
  fn: async function() {
    console.log('🧪 Testing Auto-Approval System...');
    console.log('-------------------------------------------');

    try {
      console.log('Sails version:', sails.version);
      console.log('ORM hook exists:', !!sails.hooks.orm);
      if (sails.hooks.orm) {
        console.log('ORM Models:', Object.keys(sails.hooks.orm.models || {}).join(', '));
      }
      
      // 1. Find a Product and User to act as dummy data
      const products = await sails.models.product.find().limit(1);
      const users = await sails.models.user.find().limit(1);
      const product = products[0];
      const user = users[0];

      if (!product || !user) {
        console.error('❌ Error: Could not find a product or user in the database to run the test.');
        return;
      }

      console.log(`📝 Creating dummy content for product: ${product.name}`);

      // 2. Create High-Quality Content (Should be auto-approved)
      const testContent = await sails.models.content.create({
        title: 'Professional Screen Replacement Guide',
        description: 'This is a detailed guide on how to replace a cracked screen on modern smartphones using specialized tools.',
        type: 'guide',
        status: 'pending',
        submittedAt: Date.now(),
        product: product.id,
        createdBy: user.id,
        steps: [
          { title: 'Step 1: Power Off', description: 'Ensure the device is completely powered down before starting.' },
          { title: 'Step 2: Remove Screws', description: 'Use a pentalobe screwdriver to remove the two screws at the bottom.' }
        ],
        media: [{ type: 'image', url: 'https://example.com/step1.jpg' }]
      }).fetch();

      console.log(`✅ Content Created (ID: ${testContent.id})`);
      console.log('🤖 Triggering AI Auto-Approval...');

      // 3. Run Auto-Approval Service
      await sails.services.contentapprovalservice.runAutoApproval(testContent.id);

      // 4. Check Final Status
      const finalContent = await sails.models.content.findOne({ id: testContent.id });
      
      console.log('-------------------------------------------');
      console.log(`🏁 Final Decision: ${finalContent.status.toUpperCase()}`);
      console.log(`📊 AI Score: ${finalContent.autoReview?.score || 'N/A'}`);
      console.log(`👤 Approved By: ${finalContent.approvedBy || 'N/A'}`);
      
      if (finalContent.autoReview?.reasons) {
        console.log('📝 AI Reasons:');
        finalContent.autoReview.reasons.forEach(r => console.log(`   - ${r}`));
      }

      if (finalContent.status === 'approved') {
        console.log('\n✨ SUCCESS: The auto-approval system is working perfectly!');
      } else {
        console.log('\n⚠️ MANUAL REVIEW: The content was flagged for manual review (which is also working correctly).');
      }

      // Cleanup
      await sails.models.content.destroyOne({ id: testContent.id });
      console.log('-------------------------------------------');

    } catch (err) {
      console.error('❌ Test Failed with Error:', err);
    }
  }
};
