const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");


// const verifyToken = (req) => {
//     const token = req.headers.authorization?.replace("Bearer ", "");
//     if (!token) {
//         throw new Error("Access denied. No token provided.");
//     }
//     return jwt.verify(token, process.env.JWT_SECRET);
// };


// const authenticateAdmin = async (req, res, next) => {
//     try {
//         const decoded = verifyToken(req);

//         const admin = await Admin.findOne({
//             where: { dairy_name: decoded.dairy_name },
//             attributes: ["id", "dairy_name", "email"],
//         });

//         if (!admin) {
//             return res.status(403).json({ message: "Access Denied: Not an Admin" });
//         }

//         req.admin = admin;
//         next();
//     } catch (error) {
//         res.status(401).json({ message: "Invalid or expired token." });
//     }
// };
const isAdminLoggedIn = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace("Bearer ", "");

        if (!token) {
            return res.status(401).json({ message: "No token provided." });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const admin = await Admin.findOne({ where: { dairy_name: decoded.dairy_name } });

        if (!admin) {
            return res.status(404).json({ message: "Admin not found." });
        }

        req.user = decoded; // Attach user data to request object
        next(); // Pass control to next middleware/route
    } catch (error) {
        return res.status(400).json({ message: "Invalid or expired token." });
    }
};

module.exports = { isAdminLoggedIn };
