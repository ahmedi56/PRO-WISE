/**
 * Product.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    name: {
      type: 'string',
      required: true
    },
    description: {
      type: 'string',
      allowNull: true
    },
    content: {
      type: 'string',
      allowNull: true
    },
    manufacturer: {
      type: 'string',
      allowNull: true
    },
    modelNumber: {
      type: 'string',
      allowNull: true
    },
    category: {
      model: 'category'
    },
    company: {
      model: 'company'
    },
    guides: {
      collection: 'guide',
      via: 'product'
    },
    qrcodes: {
      collection: 'qrcode',
      via: 'product'
    },
    qrCodeUrl: {
      type: 'string',
      allowNull: true
    },
    status: {
      type: 'string',
      isIn: ['draft', 'published', 'archived'],
      defaultsTo: 'draft'
    },
    totalScans: {
      type: 'number',
      defaultsTo: 0
    }
  }

};
