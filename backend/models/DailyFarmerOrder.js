const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.js");
const Farmer = require("./Farmer.js");

const DailyFarmerOrder = sequelize.define(
    "DailyFarmerOrder",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },

        farmer_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Farmer,
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },

        cow_quantity: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },

        cow_fat: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },

        cow_rate: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        pure_quantity: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },

        pure_fat: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },

        pure_rate: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        buffalo_quantity: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },

        buffalo_fat: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },

        buffalo_rate: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },

    },

    {
        timestamps: false,
        tableName: "daily_farmer_orders",
    }
);

// Define association
DailyFarmerOrder.belongsTo(Farmer, {
    foreignKey: "farmer_id",
    as: "farmer",
});

module.exports = DailyFarmerOrder;
