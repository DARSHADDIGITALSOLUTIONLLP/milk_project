const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.js");
const User = require("./User.js");

const Vacation = sequelize.define("Vacation", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
    },
    vacation_start: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    vacation_end: {
        type: DataTypes.DATEONLY,
        allowNull: true, // NULL means a one-day vacation
    },
    // ✅ Store shift as STRING instead of ENUM
    shift: {
        type: DataTypes.STRING, // Stores "morning", "evening", or "both"
        allowNull: false,
        validate: {
            isIn: [["morning", "evening", "both"]], // Ensures only valid values
        },
    },
    admin_notified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Whether the admin has been notified and acknowledged this vacation",
    },
    admin_notified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Whether the admin has been notified and acknowledged this vacation",
    },
    admin_notified_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
        comment: "Timestamp when admin acknowledged the vacation notification",
    },
}, {
    timestamps: false,
    tableName: "vacations",
});

// Define association with alias for eager loading
Vacation.belongsTo(User, {
    foreignKey: "user_id",
    as: "User",
});

module.exports = Vacation;
