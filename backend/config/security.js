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
    allowOrigins: '*',
    allowCredentials: true,
    allowAnyOriginWithCredentialsUnsafe: true,
    allowRequestHeaders: 'content-type, authorization, x-requested-with'
  },

  csrf: false // Disable CSRF for API

};
