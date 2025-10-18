const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.js");
const bcrypt = require("bcrypt");

const Admin = sequelize.define("Admin", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    dairy_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        // unique: true,
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        // unique: true,
        validate: {
            isEmail: true,
        },
    },
    // comment: "Firebase Cloud Messaging token for push notifications",
    fcm_token: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: null,
    },

    password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    contact: {
        type: DataTypes.STRING(20),
        allowNull: false,
        // unique: true,
    },
    address: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    payment_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    res_date: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
    },
    end_date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    periods: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    cow_rate: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
    },
    buffalo_rate: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
    },
    pure_rate: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
    },
    farmer_cow_rate: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
    },
    farmer_buffalo_rate: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
    },
    farmer_pure_rate: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
    },
    delivery_charges: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: null,
    },
    qr_image: {
        type: DataTypes.BLOB("long"),  // Use LONGBLOB instead of BLOB
        allowNull: true,
        defaultValue: null,
        comment: "Binary data for the QR code image",
    },
    upi_address: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
        comment: "UPI payment address",
    },
    bank_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
        comment: "Bank name of the admin",
    },
    branch_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
        comment: "Branch name of the bank",
    },
    account_number: {
        type: DataTypes.STRING(50),
        allowNull: true,
        // unique: true,
        comment: "Bank account number of the admin",
    },
    ifsc_code: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: "IFSC code of the bank branch",
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    // 🔹 New request column for status (default: true)
    request: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true, // By default, the status is true
    },
}, {
    timestamps: false,
    tableName: "admin_registration",
});

// 🔹 Hash password before saving the user
Admin.beforeCreate(async (admin) => {
    const salt = await bcrypt.genSalt(10);
    admin.password_hash = await bcrypt.hash(admin.password_hash, salt);
});

module.exports = Admin;