/**
 * Global Variable Configuration
 * (sails.config.globals)
 *
 * Configure which global variables which will be exposed to your app's
 * server-side code.
 *
 * For more information on configuring global variables, check out:
 * https://sailsjs.com/config/globals
 */

module.exports.globals = {

  /****************************************************************************
    *                                                                           *
    * Expose the lodash installed in Sails core as a global variable.           *
    * (if you instead want to use your own default lodash, you can install it   *
    *  in your project registry and require it here.)                           *
    *                                                                           *
    ****************************************************************************/

  _: require('@sailshq/lodash'),

  /****************************************************************************
    *                                                                           *
    * Expose the async installed in Sails core as a global variable.            *
    * (if you instead want to use your own default async, you can install it    *
    *  in your project registry and require it here.)                           *
    *                                                                           *
    ****************************************************************************/

  async: require('async'),

  /****************************************************************************
    *                                                                           *
    * Expose the sails instance representing your app.                          *
    *                                                                           *
    ****************************************************************************/

  sails: true,

  /****************************************************************************
    *                                                                           *
    * Expose each of your app's models as global variables.                     *
    * (See the "models" setting for details)                                    *
    *                                                                           *
    ****************************************************************************/

  models: true,

  /****************************************************************************
    *                                                                           *
    * Expose each of your app's services as global variables.                   *
    *                                                                           *
    ****************************************************************************/

  services: true,

};
