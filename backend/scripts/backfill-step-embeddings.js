/**
 * backfill-step-embeddings.js
 * 
 * Usage: node scripts/backfill-step-embeddings.js
 * 
 * Purpose: Computes and saves vector embeddings for all Guide Steps in the database.
 */

const sails = require('sails');
require('dotenv').config();

console.log('--- Initializing Sails for Standalone Step Backfill ---');

sails.load({
  hooks: {
    grunt: false,
    views: false,
    sockets: require('sails-hook-sockets'),
    orm: require('sails-hook-orm')
  },
  log: { level: 'info' }
}, async (err) => {
  if (err) {
    console.error('Failed to load Sails:', err);
    process.exit(1);
  }

  try {
    console.log('=== Starting Standalone Step Embedding Backfill ===');

    if (!sails.services.geminiservice || !sails.services.geminiservice.isAvailable()) {
      console.error('CRITICAL: Gemini service is not configured or unavailable. Check GOOGLE_AI_API_KEY.');
      sails.lower();
      process.exit(1);
    }

    const StepModel = sails.models.step;
    if (!StepModel) {
      console.error('CRITICAL: Step model not found after load.');
      sails.lower();
      process.exit(1);
    }

    const steps = await StepModel.find({});
    console.log(`Found ${steps.length} steps to process.`);

    let successCount = 0;
    let failCount = 0;

    for (const step of steps) {
      const textToEmbed = `${step.title || ''}\n${step.description || ''}`.trim();
      if (!textToEmbed) {
        console.log(`Skipping step [${step.id}] because it has no title or description.`);
        continue;
      }

      process.stdout.write(`Embedding step [${step.id}]: "${step.title}"... `);

      try {
        const result = await sails.services.geminiservice.getEmbedding(textToEmbed, 'RETRIEVAL_DOCUMENT');
        if (result && result.success && Array.isArray(result.embedding)) {
          await StepModel.updateOne({ id: step.id }).set({ embedding: result.embedding });
          successCount++;
          console.log('[✓]');
        } else {
          failCount++;
          console.log('[✗]');
        }
      } catch (err) {
        failCount++;
        console.log(`[!] Error: ${err.message}`);
      }
    }

    console.log('\n--- Step Backfill Summary ---');
    console.log(`Total Steps:   ${steps.length}`);
    console.log(`Success:       ${successCount}`);
    console.log(`Failed:        ${failCount}`);
    console.log('======================================');

    sails.lower(() => process.exit(0));
  } catch (err) {
    console.error('Unexpected Error:', err);
    sails.lower(() => process.exit(1));
  }
});
