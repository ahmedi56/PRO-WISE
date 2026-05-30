module.exports = {
  friendlyName: 'Debug DB Content',
  description: 'Audit existing support content in the database.',
  fn: async function () {
    sails.log.info('Sails keys:', Object.keys(sails).filter(k => k.toLowerCase().includes('model')));
    sails.log.info('Sails hooks:', Object.keys(sails.hooks));
    
    if (global.RepairGuide) {
        sails.log.info('RepairGuide is global');
    } else {
        sails.log.info('RepairGuide is NOT global');
    }
  }
};
