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
      required: false
    },
    actorRole: {
      type: 'string',
      allowNull: true
    },
    target: {
      type: 'string',
      allowNull: true
    },
    targetType: {
      type: 'string',
      allowNull: true
    },
    targetLabel: {
      type: 'string',
      allowNull: true
    },
    ipAddress: {
      type: 'string',
      allowNull: true
    },
    userAgent: {
      type: 'string',
      allowNull: true
    },
    severity: {
      type: 'string',
      defaultsTo: 'info',
      isIn: ['info', 'warning', 'critical']
    },
    company: {
      model: 'company'
    },
    details: {
      type: 'json'
    }
  }

};
