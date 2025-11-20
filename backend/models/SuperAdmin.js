const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.js");
const bcrypt = require("bcrypt");

const SuperAdmin = sequelize.define("SuperAdmin", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: {
            args: true,
            msg: "Email is already in use. Please use a different email.", // Custom message for duplicate email
        },
        validate: {
            isEmail: {
                args: true,
                msg: "Invalid email format. Please enter a valid email address.", // Custom validation message
            },
        },
    },
    contact: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: {
            args: true,
            msg: "Contact number already exists. Please use a different number.", // Custom message for duplicate contact
        },
        validate: {
            isNumeric: {
                args: true,
                msg: "Contact number must contain only numbers.", // Custom validation message
            },
            len: {
                args: [10, 10],
                msg: "Contact number must be exactly 10 digits long.", // Custom length validation message
            },
        },
    },
    password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: {
                args: true,
                msg: "Password cannot be empty.", // Custom message for empty password
            },
        },
    },
}, {
    timestamps: true, // Automatically adds createdAt & updatedAt
    tableName: "super_admin",
});

// 📌 Hash password before creating a new super admin
SuperAdmin.beforeCreate(async (instance) => {
    if (instance.password_hash) {
        const salt = await bcrypt.genSalt(10);
        instance.password_hash = await bcrypt.hash(instance.password_hash, salt);
    }
});

module.exports = SuperAdmin;
