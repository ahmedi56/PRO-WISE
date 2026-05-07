/**
 * NotificationService.js
 *
 * @description :: Service for creating and sending user notifications.
 */

module.exports = {

  /**
   * Create a notification for a specific user
   */
  notifyUser: async function(userId, options) {
    try {
      const { title, message, type = 'info', link = null } = options;
      
      const notification = await Notification.create({
        user: userId,
        title,
        message,
        type,
        link
      }).fetch();

      return notification;
    } catch (err) {
      sails.log.error('NotifyUser error:', err);
      return null;
    }
  },

  /**
   * Notify all users with a specific role
   */
  notifyRole: async function(roleName, options) {
    try {
      const role = await Role.findOne({ name: roleName });
      if (!role) {
        sails.log.warn(`Cannot notify role: ${roleName} - Role not found`);
        return [];
      }

      const users = await User.find({ role: role.id });
      const notifications = [];

      for (const user of users) {
        const n = await this.notifyUser(user.id, options);
        if (n) notifications.push(n);
      }

      return notifications;
    } catch (err) {
      sails.log.error(`NotifyRole ${roleName} error:`, err);
      return [];
    }
  },

  /**
   * Short-hand to notify all super admins
   */
  notifySuperAdmins: async function(options) {
    return this.notifyRole('super_admin', options);
  }

};
