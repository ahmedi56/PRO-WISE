/**
 * EmailService
 *
 * @description :: Server-side logic for managing emails
 */

module.exports = {

  sendRegistrationEmail: async function (email) {
    sails.log.info('\n=========================================');
    sails.log.info(`[EMAIL OUTBOX] To: ${email}`);
    sails.log.info('[EMAIL OUTBOX] Subject: Registration Received');
    sails.log.info('[EMAIL OUTBOX] Body: Waiting for super admin approval');
    sails.log.info('=========================================\n');
  },

  sendApprovalEmail: async function (email) {
    sails.log.info('\n=========================================');
    sails.log.info(`[EMAIL OUTBOX] To: ${email}`);
    sails.log.info('[EMAIL OUTBOX] Subject: Account Approved');
    sails.log.info('[EMAIL OUTBOX] Body: Your account is approved. You can now login.');
    sails.log.info('=========================================\n');
  }

};
