require('dotenv').config();
const { sequelize, Role } = require('../models');

const seedDocs = async () => {
    try {
        await sequelize.sync();

        const roles = ['Admin', 'Customer', 'Technician'];

        for (const roleName of roles) {
            await Role.findOrCreate({
                where: { name: roleName }
            });
            console.log(`Role ensured: ${roleName}`);
        }

        console.log('Seeding complete.');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedDocs();
