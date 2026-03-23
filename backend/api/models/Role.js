/**
 * Role.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    name: {
      type: 'string',
      required: true,
      unique: true,
      isIn: ['super_admin', 'administrator', 'company_admin', 'technician', 'client', 'user']
    },
    description: {
      type: 'string',
      allowNull: true
    },
    users: {
      collection: 'user',
      via: 'role'
    },
    permissions: {
      type: 'json',
      description: 'Array of strings representing specific capabilities.',
      defaultsTo: []
    }
  }

};
