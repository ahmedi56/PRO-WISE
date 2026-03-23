/**
 * Company.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    name: {
      type: 'string',
      required: true,
      unique: true
    },
    description: {
      type: 'string',
      allowNull: true
    },
    logo: {
      type: 'string',
      allowNull: true
    },
    contactInfo: {
      type: 'string',
      allowNull: true
    },
    address: {
      type: 'string',
      allowNull: true
    },
    website: {
      type: 'string',
      allowNull: true
    },
    status: {
      type: 'string',
      isIn: ['pending', 'active', 'deactivated'],
      defaultsTo: 'pending'
    },
    products: {
      collection: 'product',
      via: 'company'
    },
    users: {
      collection: 'user',
      via: 'company'
    }
  }

};
