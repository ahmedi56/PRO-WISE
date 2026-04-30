/**
 * Notification.js
 *
 * @description :: A model definition represents a database table/collection for user notifications.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    title: {
      type: 'string',
      required: true
    },
    message: {
      type: 'string',
      required: true
    },
    type: {
      type: 'string',
      isIn: ['info', 'success', 'warning', 'error'],
      defaultsTo: 'info'
    },
    read: {
      type: 'boolean',
      defaultsTo: false
    },
    user: {
      model: 'user',
      required: true
    },
    link: {
      type: 'string',
      allowNull: true
    }
  }

};
