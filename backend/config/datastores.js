/**
 * Datastores
 * (sails.config.datastores)
 *
 * A set of datastore configurations which tell Sails where to fetch or save
 * data when you execute built-in model methods like `.find()` and `.create()`.
 *
 * For more information on configuring datastores, check out:
 * https://sailsjs.com/config/datastores
 */

module.exports.datastores = {

  default: {
    adapter: require('sails-mongo'),
    url: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/prowise',
  },

};
