/**
 * RefreshToken.js
 *
 * @description :: A model to store refresh tokens for session management and revocation.
 */

module.exports = {

  attributes: {

    token: {
      type: 'string',
      required: true,
      unique: true
    },

    user: {
      model: 'user',
      required: true
    },

    expiresAt: {
      type: 'number',
      required: true
    },

    revoked: {
      type: 'boolean',
      defaultsTo: false
    },

    replacedBy: {
      type: 'string',
      allowNull: true
    }

  },

};
