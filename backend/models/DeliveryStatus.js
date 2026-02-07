const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.js"); // Import your Sequelize instance
const User = require("./User.js"); // Import User model

const DeliveryStatus = sequelize.define(
    "DeliveryStatus",
    {
        delivery_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        userid: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: User, // Foreign key referencing the User model
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },
        shift: {
            type: DataTypes.ENUM("morning", "evening"),
            allowNull: false,
        },
        quantity_array: {
            type: DataTypes.JSON, // ✅ Store quantity as an array
            allowNull: false,
            defaultValue: [0, 0, 0] // Default array with length 3
        },
        date: {
            type: DataTypes.DATEONLY, // Stores only the date (YYYY-MM-DD)
            allowNull: false,
        },
        status: {
            type: DataTypes.BOOLEAN, // Boolean status field
            allowNull: false,
            defaultValue: true, // Default value is true
        },
        timestamp: {
            type: DataTypes.DATE, // Stores the full timestamp
            defaultValue: DataTypes.NOW,
        },
    },
    {
        tableName: "DeliveryStatus",
        timestamps: false, // Disables default createdAt & updatedAt columns
    }
);


module.exports = DeliveryStatus;