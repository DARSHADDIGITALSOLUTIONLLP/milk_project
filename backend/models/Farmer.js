const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.js");
const bcrypt = require("bcrypt");
const Admin = require("./Admin.js");

const Farmer = sequelize.define(
    "Farmer",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        full_name: {
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
                is: /^[0-9]{10}$/, // 10-digit format
            },
        },
        address: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        password_hash: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        status: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
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
        milk_types: {
            type: DataTypes.JSON, // Sequelize will store this as a JSON string in MySQL
            allowNull: false,
            defaultValue: [], // start with empty array
        },
        advance_payment: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0
        },
        advance_payment_date: {
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
        timestamps: false,
        tableName: "farmers",
    }
);

// Password hashing before creating a farmer
Farmer.beforeCreate(async (farmer) => {
    const salt = await bcrypt.genSalt(10);
    farmer.password_hash = await bcrypt.hash(farmer.password_hash, salt);
});

module.exports = Farmer;