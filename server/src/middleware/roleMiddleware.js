const { User, Role } = require('../models');

const checkRole = (requiredRole) => {
    return async (req, res, next) => {
        try {
            const user = await User.findByPk(req.userId, {
                include: Role
            });

            if (!user || !user.Role) {
                return res.status(403).json({ message: 'Access denied: No role assigned' });
            }

            if (user.Role.name !== requiredRole && requiredRole !== 'Any') {
                return res.status(403).json({ message: `Access denied: Requires ${requiredRole} role` });
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error checking role' });
        }
    };
};

module.exports = checkRole;
