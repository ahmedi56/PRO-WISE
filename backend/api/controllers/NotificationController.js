/**
 * NotificationController
 *
 * @description :: Server-side actions for handling notifications.
 */

module.exports = {

  /**
   * GET /api/notifications
   * Get notifications for the authenticated user.
   */
  find: async function (req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { limit = 20, page = 1, read } = req.query;
      const where = { user: req.user.id };
      
      if (read !== undefined) {
        where.read = read === 'true';
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const notifications = await Notification.find(where)
        .skip(skip)
        .limit(parseInt(limit))
        .sort('createdAt DESC');

      const total = await Notification.count(where);
      const unreadCount = await Notification.count({ user: req.user.id, read: false });

      return res.json({
        notifications,
        pagination: {
          total,
          unreadCount,
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });

    } catch (err) {
      sails.log.error('Get notifications error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
   * PATCH /api/notifications/:id
   * Mark a notification as read.
   */
  update: async function (req, res) {
    try {
      const { id } = req.params;
      const { read } = req.body;

      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const notification = await Notification.findOne({ id, user: req.user.id });
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }

      const updatedNotification = await Notification.updateOne({ id })
        .set({ read: read !== undefined ? read : true });

      return res.json(updatedNotification);

    } catch (err) {
      sails.log.error('Update notification error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
   * PUT /api/notifications/mark-all-read
   * Mark all notifications as read for the current user.
   */
  markAllAsRead: async function (req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      await Notification.update({ user: req.user.id, read: false })
        .set({ read: true });

      return res.json({ message: 'All notifications marked as read' });

    } catch (err) {
      sails.log.error('Mark all notifications error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  /**
   * DELETE /api/notifications/:id
   * Remove a notification.
   */
  destroy: async function (req, res) {
    try {
      const { id } = req.params;

      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const notification = await Notification.findOne({ id, user: req.user.id });
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }

      await Notification.destroyOne({ id });

      return res.json({ message: 'Notification removed' });

    } catch (err) {
      sails.log.error('Delete notification error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

};
