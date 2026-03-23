/**
 * Local environment settings
 *
 * Use this file to specify configuration settings for use while developing
 * the app on your personal system.
 */

module.exports = {
  // Explicitly bind to 0.0.0.0 to ensure the backend is reachable from 
  // mobile devices on the same local network using the 192.168.x.x IP.
  explicitHost: '0.0.0.0',

  port: process.env.PORT || 1337,

  // Any other local overrides
};
