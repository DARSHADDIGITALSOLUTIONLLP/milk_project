const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.js");
const bcrypt = require("bcrypt");
const Admin = require("./Admin.js");

const User = sequelize.define(
    "User",
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
        password_hash: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        contact: {
            type: DataTypes.STRING(20),
            allowNull: false,
            validate: {
                is: /^[0-9]{10}$/, // Ensures 10-digit phone number
            },
            unique: true,
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
        milk_type: {
            type: DataTypes.ENUM("buffalo", "cow", "pure"),
            allowNull: false,
        },
        quantity: {
            type: DataTypes.FLOAT,
            allowNull: false,
            validate: {
                min: 0.5,
            },
        },
        request: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        // start_date: {
        //     type: DataTypes.DATEONLY,
        //     allowNull: false,
        //     defaultValue: sequelize.fn("CURDATE"), // Automatically sets today's date
        //     validate: {
        //         isValidStartDate(value) {
        //             const today = new Date().toISOString().split("T")[0];
        //             const inputDate = new Date(value).toISOString().split("T")[0];
        //             if (inputDate < today) {
        //                 throw new Error("Start date must be today or later.");
        //             }
        //         },
        //     },
        // },
        start_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            defaultValue: new Date().toISOString().split("T")[0], // ✅ Sets today's date
            validate: {
                isValidStartDate(value) {
                    const today = new Date().toISOString().split("T")[0];
                    const inputDate = new Date(value).toISOString().split("T")[0];
                    if (inputDate < today) {
                        throw new Error("Start date must be today or later.");
                    }
                },
            },
        },


        // 🔹 Delivery status for morning and evening separately
        delivered_morning: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        delivered_evening: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        vacation_mode_morning: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        vacation_mode_evening: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        advance_payment: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0.0
        },
        vacation_days: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0,
        },
        qr_image: {
            type: DataTypes.BLOB("long"),  // Use LONGBLOB instead of BLOB
            allowNull: true,
            defaultValue: null,
            comment: "Binary data for the QR code image",
        },
        shift: {
            type: DataTypes.STRING, // Supports "morning", "evening", "both"
            allowNull: false,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        timestamps: false,
        tableName: "users",
    }
);

// 🔹 Hash password before saving the user
User.beforeCreate(async (user) => {
    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(user.password_hash, salt);
});

module.exports = User;
