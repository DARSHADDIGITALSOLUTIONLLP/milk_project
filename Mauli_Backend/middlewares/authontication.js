const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Admin = require("../models/Admin");
const SuperAdmin = require("../models/SuperAdmin");
const DeliveryBoy = require("../models/DeliveryBoy");
const Farmer = require("../models/Farmer"); // ✅ Import Farmer model

const authenticateUser = async (req, res, next) => {
    try {
        const token = req.header("Authorization");

        if (!token) {
            return res.status(401).json({ error: "Access denied. No token provided." });
        }

        // Verify and decode the token
        const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);

        // 🔹 SuperAdmin
        if (decoded.role === "super_admin") {
            const superAdmin = await SuperAdmin.findOne({ where: { id: decoded.id } });
            if (superAdmin) {
                req.user = { id: superAdmin.id, role: "super_admin" };
                return next();
            }
        }

        // 🔹 Admin
        if (decoded.role === "admin") {
            const admin = await Admin.findOne({ where: { id: decoded.id } });
            if (admin) {
                req.user = { id: admin.id, role: "admin", dairy_name: admin.dairy_name };
                return next();
            }
        }

        // 🔹 DeliveryBoy
        if (decoded.role === "delivery_boy") {
            const deliveryBoy = await DeliveryBoy.findOne({ where: { id: decoded.id } });
            if (deliveryBoy) {
                req.user = { id: deliveryBoy.id, role: "delivery_boy", dairy_name: deliveryBoy.dairy_name };
                return next();
            }
        }

        // 🔹 User
        if (decoded.role === "user") {
            const user = await User.findOne({ where: { id: decoded.id } });
            if (user) {
                req.user = { id: user.id, role: "user", dairy_name: user.dairy_name };
                return next();
            }
        }

        // 🔹 Farmer ✅
        if (decoded.role === "farmer") {
            const farmer = await Farmer.findOne({ where: { id: decoded.id } });
            if (farmer) {
                req.user = { id: farmer.id, role: "farmer", dairy_name: farmer.dairy_name };
                return next();
            }
        }

        return res.status(404).json({ error: "User not found." });

    } catch (error) {
        console.error("❌ Authentication Error:", error);
        return res.status(400).json({ error: "Invalid token." });
    }
};

const authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Access denied." });
        }
        next();
    };
};

module.exports = { authenticateUser, authorizeRole };
