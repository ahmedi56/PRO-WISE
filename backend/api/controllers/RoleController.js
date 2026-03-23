/**
 * RoleController
 *
 * @description :: Returns available roles (Super Admin only).
 */

module.exports = {

  /**
     * GET /api/roles
     * Get all roles (Super Admin only)
     */
  getAll: async function (req, res) {
    try {
      const roles = await Role.find().sort('name ASC');
      return res.json(roles);
    } catch (err) {
      sails.log.error('Get roles error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

};
