const jwt = require("jsonwebtoken");
const User = require("../models/User");

// const authenticateUser = async (req, res, next) => {
//     const token = req.header("Authorization");
//     if (!token) {
//         return res.status(401).json({ error: "Access denied. No token provided." });
//     }

//     try {
//         const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);

//         // Fetch user from database to get dairy_name
//         const user = await User.findOne({ where: { id: decoded.id } });

//         if (!user) {
//             return res.status(404).json({ error: "User not found." });
//         }

//         req.user = {
//             id: user.id,
//             dairy_name: user.dairy_name, // Attach dairy_name for further use
//         };

//         next();
//     } catch (error) {
//         res.status(400).json({ error: "Invalid token." });
//     }
// };
const isUserLoggedIn = async (req, res, next) => {
    try {
        const token = req.header("Authorization");

        if (!token) {
            return res.status(401).json({ message: "No token provided." });
        }

        // Verify token
        const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);

        // Find user by ID
        const user = await User.findOne({ where: { id: decoded.id } });

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        req.user = decoded; // Attach user data to the request object
        next(); // Pass control to the next middleware or route handler
    } catch (error) {
        return res.status(400).json({ message: "Invalid or expired token." });
    }
};

module.exports = { isUserLoggedIn };
