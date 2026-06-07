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
    allowOrigins: [
      'https://pro-wise-web.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000'
    ],
    allowCredentials: true,
    allowRequestHeaders: 'content-type, authorization, x-requested-with'
  },

  csrf: false // Disable CSRF for API

};
