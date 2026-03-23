/**
 * Default model settings
 * (sails.config.models)
 *
 * Your default, project-wide model settings.
 *
 * For details about all available model settings, see:
 * https://sailsjs.com/config/models
 */

module.exports.models = {

  schema: true,

  migrate: 'safe',

  attributes: {
    createdAt: { type: 'number', autoCreatedAt: true },
    updatedAt: { type: 'number', autoUpdatedAt: true },
    id: { type: 'string', columnName: '_id' },
  },

  dataEncryptionKeys: {
    default: 'IL3tc9/Ix/9Eb3RmU4AfMTHsWUORK4kzzNiTE9/6DSU='
  },

  cascadeOnDestroy: true

};
