/**
 * Security Settings
 * (sails.config.security)
 *
 * For more information on configuring security settings, check out:
 * https://sailsjs.com/config/security
 */

module.exports.security = {

  cors: {
    allRoutes: true,
    allowOrigins: '*', // Adjust for production
    allowCredentials: false,
    allowRequestHeaders: 'content-type, authorization'
  },

  csrf: false // Disable CSRF for API

};
