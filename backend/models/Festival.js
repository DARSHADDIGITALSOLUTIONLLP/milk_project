const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.js");

const Festival = sequelize.define(
    "Festival",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: "Festival name (e.g., Diwali, Holi)",
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            comment: "Festival date in YYYY-MM-DD format",
        },
        year: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "Year for this festival occurrence",
        },
        greeting: {
            type: DataTypes.TEXT,
            allowNull: false,
            comment: "Greeting message to send to customers",
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            comment: "Whether this festival is active for notifications",
        },
        is_recurring: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: "True for fixed date festivals (e.g., Republic Day), False for lunar festivals (e.g., Diwali)",
        },
        festival_type: {
            type: DataTypes.ENUM('national', 'religious', 'cultural', 'other'),
            allowNull: false,
            defaultValue: 'cultural',
            comment: "Type of festival",
        },
        icon: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: "Emoji or icon for the festival (e.g., 🪔, 🎨)",
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        tableName: "festivals",
        timestamps: false,
    }
);

module.exports = Festival;
