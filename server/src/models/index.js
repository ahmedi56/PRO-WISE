const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Role = sequelize.define('Role', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    }
});

const User = sequelize.define('User', {
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    }
});

const Product = sequelize.define('Product', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    },
    sku: {
        type: DataTypes.STRING,
        unique: true
    }
});

const Guide = sequelize.define('Guide', {
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    }
});

const QRCode = sequelize.define('QRCode', {
    code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    }
});

// Relationships
User.belongsTo(Role);
Role.hasMany(User);

Product.hasOne(QRCode);
QRCode.belongsTo(Product);

Product.hasMany(Guide);
Guide.belongsTo(Product);

module.exports = {
    sequelize,
    User,
    Role,
    Product,
    Guide,
    QRCode
};
