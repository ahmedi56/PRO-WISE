/**
 * User.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

const bcrypt = require('bcryptjs');

module.exports = {

  attributes: {
    name: {
      type: 'string',
      required: true
    },
    username: {
      type: 'string',
      required: true,
      unique: true
    },
    email: {
      type: 'string',
      required: true,
      unique: true,
      isEmail: true
    },
    password: {
      type: 'string',
      required: true,
      protect: true
    },
    phone: {
      type: 'string',
      allowNull: true
    },
    avatar: {
      type: 'string',
      allowNull: true
    },
    role: {
      model: 'role'
    },
    company: {
      model: 'company'
    },
    status: {
      type: 'string',
      isIn: ['active', 'deactivated', 'pending'],
      defaultsTo: 'active'
    },
    isTechnician: {
      type: 'boolean',
      defaultsTo: false
    },
    technicianStatus: {
      type: 'string',
      isIn: ['none', 'pending', 'approved', 'rejected'],
      defaultsTo: 'none'
    },
    technicianProfile: {
      type: 'json'
    }
  },

  customToJSON: function () {
    return _.omit(this, ['password']);
  },

  beforeCreate: async function (valuesToSet, proceed) {
    if (valuesToSet.password) {
      valuesToSet.password = await bcrypt.hash(valuesToSet.password, 10);
    }
    // Auto-generate username from name if not provided
    if (!valuesToSet.username && valuesToSet.name) {
      valuesToSet.username = valuesToSet.name
        .toLowerCase()
        .replace(/\s+/g, '.')
                + '.' + Date.now().toString(36);
    }
    return proceed();
  },

  beforeUpdate: async function (valuesToSet, proceed) {
    if (valuesToSet.password) {
      valuesToSet.password = await bcrypt.hash(valuesToSet.password, 10);
    }
    return proceed();
  }

};
