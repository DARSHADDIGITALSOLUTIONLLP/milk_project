const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.js");
const bcrypt = require("bcrypt");
const Admin = require("./Admin.js"); // Import the Admin model

const DeliveryBoy = sequelize.define(
    "DeliveryBoy",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        contact: {
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true,
            validate: {
                is: /^[0-9]{10}$/, // Ensures 10-digit phone number
            },
        },
        address: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        dairy_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            references: {
                model: Admin,
                key: "dairy_name",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },
        password_hash: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: true,

        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        timestamps: false,
        tableName: "delivery_boys",
    }
);

// 🔹 Hash password before saving the delivery boy
DeliveryBoy.beforeCreate(async (deliveryBoy) => {
    const salt = await bcrypt.genSalt(10);
    deliveryBoy.password_hash = await bcrypt.hash(deliveryBoy.password_hash, salt);
});

module.exports = DeliveryBoy;
