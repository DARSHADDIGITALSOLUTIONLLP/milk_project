const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.js");
const Farmer = require("./Farmer");

const FarmerPayment = sequelize.define(
    "FarmerPayment",
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
        total_amount: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        total_cow_quantity: {
            type: DataTypes.FLOAT,
            defaultValue: 0,
        },
        total_buffalo_quantity: {
            type: DataTypes.FLOAT,
            defaultValue: 0,
        },
        total_pure_quantity: {
            type: DataTypes.FLOAT,
            defaultValue: 0,
        },
        payment_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        week_number: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        week_start_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        week_end_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        tableName: "farmer_payments",
        timestamps: false,
    }
);

// Automatically update payment_date when status changes
FarmerPayment.beforeUpdate(async (payment, options) => {
    if (payment.changed("status")) {
        payment.payment_date = new Date();
    }
});

module.exports = FarmerPayment;
