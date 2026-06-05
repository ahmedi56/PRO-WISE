module.exports = {
  friendlyName: 'Check Salim User',
  fn: async function() {
    try {
      console.log('sails keys:', Object.keys(sails || {}));
      if (sails && sails.models) {
        console.log('sails.models keys:', Object.keys(sails.models));
      } else {
        console.log('sails.models is undefined');
      }
      // Let's search using the global models if they are loaded on global
      const globalKeys = Object.keys(global);
      const modelKeys = globalKeys.filter(k => k === 'User' || k === 'Role' || k === 'Company');
      console.log('Global model keys:', modelKeys);
      
      // Let's try to query using sails.helpers or similar if available, or just query directly if model exists on global
      if (global.User) {
        const u = await global.User.findOne({ name: { contains: 'Salim' } });
        console.log('Found by global.User:', u);
      }
    } catch (e) {
      console.error(e);
    }
  }
};
