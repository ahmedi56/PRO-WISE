module.exports = {

  friendlyName: 'Eval recs',

  description: 'Eval recs.',

  fn: async function () {
    const getRecommendations = sails.helpers.getSimilarityRecommendations;

    sails.log.info('--- SEMANTIC SEARCH: WORKSTATION ---');
    const pc = await Product.findOne({ name: 'PRO-WISE Creator Workstation' });
    if (pc) {
      const recs = await getRecommendations.with({ productId: pc.id, limit: 4 });
      sails.log.info(`Found PRO-WISE Workstation with ${pc.components?.length} components.`);
      sails.log.info(`Recommendations for ${pc.name} (has NVIDIA GPU component):`);
      recs.forEach((r, i) => sails.log.info(`  ${i+1}. [Score: ${r.score.toFixed(3)}] ${r.name}`));
    } else {
      sails.log.warn('PRO-WISE Workstation not found. Did bootstrap run?');
    }

    sails.log.info('\n--- SEMANTIC SEARCH FOR "NVIDIA RTX" ---');
    const searchRes = await getRecommendations.with({ query: 'NVIDIA RTX', limit: 4 });
    sails.log.info(`Results for "NVIDIA RTX":`);
    searchRes.forEach((r, i) => sails.log.info(`  ${i+1}. [Score: ${r.score.toFixed(3)}] ${r.name}`));

    sails.log.info('\n--- SEMANTIC SEARCH FOR "Snapdragon 8 Gen 3" ---');
    const searchRes2 = await getRecommendations.with({ query: 'Snapdragon 8 Gen 3', limit: 4 });
    sails.log.info(`Results for "Snapdragon 8 Gen 3":`);
    searchRes2.forEach((r, i) => sails.log.info(`  ${i+1}. [Score: ${r.score.toFixed(3)}] ${r.name}`));
  }
};
