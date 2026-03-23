/**
 * AuditLog.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    action: {
      type: 'string',
      required: true
    },
    user: {
      model: 'user',
      required: true
    },
    target: {
      type: 'string',
      allowNull: true
    },
    details: {
      type: 'json'
    }
  }

};
