const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.js'); // Import Sequelize instance
const User = require('./User.js'); // Import User model

const payment_details = sequelize.define('payment_details', {
    payment_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    start_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    userid: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User, // Foreign key referencing the User model
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    received_payment: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0.0
    },
    advancePayment: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: User.advance_payment // Default value from User model
    },
    pending_payment: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0.0
    },
    payment: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0.0
    },
    delivery_charges: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0.0
    },
    month_year: {
        type: DataTypes.STRING(7), // Format: YYYY-MM
        allowNull: false,
    },
    timestamp: {
        type: DataTypes.DATE, // Stores the full timestamp
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'PaymentDetails',
    timestamps: false // Disables default createdAt & updatedAt columns
});

// Establish foreign key relationship
// User.hasMany(PaymentDetails, { foreignKey: 'userid' });
// PaymentDetails.belongsTo(User, { foreignKey: 'userid' });

module.exports = payment_details;