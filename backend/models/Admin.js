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
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
    },
    buffalo_rate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
    },
    pure_rate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
    },
    farmer_cow_rate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
    },
    farmer_buffalo_rate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
    },
    farmer_pure_rate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
    },
    delivery_charges: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: null,
    },
    qr_image: {
        type: DataTypes.BLOB("long"),  // Use LONGBLOB instead of BLOB
        allowNull: true,
        defaultValue: null,
        comment: "Binary data for the QR code image",
    },
    dairy_logo: {
        type: DataTypes.BLOB("long"),  // Store dairy logo as binary data
        allowNull: true,
        defaultValue: null,
        comment: "Binary data for the dairy logo image",
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
    // Customer notification fields
    customer_notification: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
        comment: "Custom notification message for customers (e.g., rate changes, important announcements)",
    },
    customer_notification_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Whether the customer notification is active and should be shown to customers",
    },
    customer_notification_updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
        comment: "Timestamp when notification was last updated",
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