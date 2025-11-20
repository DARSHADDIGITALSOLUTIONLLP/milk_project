const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.js"); // Import your Sequelize instance
const User = require("./User.js"); // Import User model
const DeliveryStatus = require("./deliveryStatus.js");
// const DeliveryStatus = require("./DeliveryStatus.js");

const additinalOrder = sequelize.define(
    "additinalOrder",
    {
        additinalOrder_id: {
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
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        timestamp: {
            type: DataTypes.DATE, // Stores the full timestamp
            defaultValue: DataTypes.NOW,
        },
    },
    {
        tableName: "additinalOrder",
        timestamps: false, // Disables default createdAt & updatedAt columns
    }
);


additinalOrder.belongsTo(User, {
    foreignKey: "userid",
    as: "user", // Optional alias
});



additinalOrder.hasMany(DeliveryStatus, {
    foreignKey: "userid", // Must match actual field
    sourceKey: "userid",  // Required since we're matching manually
    as: "DeliveryStatus", // Alias used in the query
});

module.exports = additinalOrder;