const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const SuperAdmin = require("../models/SuperAdmin");
const Admin = require("../models/Admin.js");
const User = require("../models/User.js");
const DeliveryBoy = require("../models/DeliveryBoy.js");
const Farmer = require("../models/Farmer");
const { sendEmail } = require("../utils/sendMail.js");
const { Op } = require("sequelize");
require("dotenv").config();
const {
  updateAdminPaymentSchema,
} = require("../validators/adminValidation.js");

module.exports.RegisterSuperAdmin = async (req, res) => {
  try {
    const { email, password_hash, contact } = req.body;

    // Check if admin already exists
    const existingUser = await SuperAdmin.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    // Create new admin user
    const admin = await SuperAdmin.create({
      email,
      password_hash: password_hash,
      contact,
    });

    res.status(201).json({ message: "Admin registered successfully", admin });
  } catch (error) {
    console.error("Error during registration:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports.login = async (req, res) => {
  try {
    const { identifier, password_hash } = req.body; // Accepts either email or contact

    if (!identifier || !password_hash) {
      return res
        .status(400)
        .json({ message: "Email/Contact and password are required" });
    }

    let user;
    let role;

    // Check SuperAdmin login
    user = await SuperAdmin.findOne({
      where: { [Op.or]: [{ email: identifier }, { contact: identifier }] },
    });
    if (user) {
      role = "super_admin";
    }

    // Check Admin login (Ensure request status is true)
    if (!user) {
      user = await Admin.findOne({
        where: { [Op.or]: [{ email: identifier }, { contact: identifier }] },
      });

      if (user) {
        role = "admin";

        // If admin request status is false, deny login
        if (!user.request) {
          return res
            .status(403)
            .json({
              message: "Your request has been denied by the Superadmin. For further assistance or clarification, please contact the Superadmin.",
            });
        }
      }
    }

    // Check DeliveryBoy login
    if (!user) {
      user = await DeliveryBoy.findOne({
        where: { [Op.or]: [{ email: identifier }, { contact: identifier }] },
      });
      role = "delivery_boy";
    }

    // Check User login (Ensure request status is true)
    if (!user) {
      user = await User.findOne({
        where: { [Op.or]: [{ email: identifier }, { contact: identifier }] },
      });
      role = "user";

      if (user) {
        // Check if user's request is approved
        if (!user.request) {
          return res
            .status(403)
            .json({ message: "Your request is currently pending. You will be able to log in once your request is approved by the admin." });
        }

        // Check if corresponding Admin (with same dairy_name) has status=true
        const admin = await Admin.findOne({ where: { dairy_name: user.dairy_name } });
        // Check end_date against today's date
        const today = new Date();
        const endDate = new Date(admin.end_date);
        if (today > endDate) {
          return res.status(403).json({
            message: "Login not allowed. Your access period has expired.",
          });
        }
        if (!admin || !admin.request) {
          return res.status(403).json({
            message:
              "Login not allowed. Associated Admin's status is not approved.",
          });
        }
      }
    }

    // Check Farmer login
    if (!user) {
      user = await Farmer.findOne({
        where: { [Op.or]: [{ email: identifier }, { contact: identifier }] },
      });

      if (user) {
        role = "farmer";

        // If admin request status is false, deny login
        if (!user.status) {
          return res
            .status(403)
            .json({
              message: "Your status is inactive .For further assistance or clarification, please contact the Admin.",
            });
        }
      }
    }

    // If no user found, return error
    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid email/contact or password" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password_hash, user.password_hash);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Invalid email/contact or password" });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in environment variables.");
    }

    //  Create JWT token payload
    const tokenPayload = {
      id: user.id,
      email: user.email,
      contact: user.contact,
      role,
    };

    // Include dairy_name if role is Admin, DeliveryBoy, or Farmer
    if (role === "admin" || role === "delivery_boy" || role === "farmer") {
      tokenPayload.dairy_name = user.dairy_name;
    }

    // Generate JWT token
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Convert Sequelize model to plain object to avoid serialization issues
    const userData = user.toJSON ? user.toJSON() : user;
    
    // Remove sensitive data
    delete userData.password_hash;
    if (userData.createdAt) delete userData.createdAt;
    if (userData.updatedAt) delete userData.updatedAt;

    res.json({ message: "Login successful", token, role, user: userData });
  } catch (error) {
    console.error("Error during login:", error.message);
    console.error("Error stack:", error.stack);
    res.status(500).json({ 
      message: "Server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports.RegisterAdmin = async (req, res) => {
  try {
    const {
      dairy_name,
      email,
      password_hash,
      contact,
      address,
      payment_amount,
      periods,
    } = req.body;

    // Check if dairy name already exists
    const DairyNameExist = await Admin.findOne({ where: { dairy_name } });
    if (DairyNameExist) {
      return res.status(400).json({ message: "Dairy name already exists." });
    }

    // 🔹 Check if email exists in any table
    const emailExists = await Promise.all([
      DeliveryBoy.findOne({ where: { email } }),
      SuperAdmin.findOne({ where: { email } }),
      Admin.findOne({ where: { email } }),
      User.findOne({ where: { email } }),
    ]);

    if (emailExists.some((user) => user !== null)) {
      return res
        .status(400)
        .json({ message: "Email already exists in another role." });
    }

    // 🔹 Check if contact exists in any table
    const contactExists = await Promise.all([
      DeliveryBoy.findOne({ where: { contact } }),
      SuperAdmin.findOne({ where: { contact } }),
      Admin.findOne({ where: { contact } }),
      User.findOne({ where: { contact } }),
    ]);

    if (contactExists.some((user) => user !== null)) {
      return res
        .status(400)
        .json({ message: "Contact number already exists in another role." });
    }

    // Set registration date as today's date
    const res_date = new Date();

    // Calculate end date based on period
    let end_date;
    switch (periods) {
      case "monthly":
        end_date = new Date(res_date);
        end_date.setMonth(end_date.getMonth() + 1);
        break;
      case "quarterly":
        end_date = new Date(res_date);
        end_date.setMonth(end_date.getMonth() + 3);
        break;
      case "half-yearly":
        end_date = new Date(res_date);
        end_date.setMonth(end_date.getMonth() + 6);
        break;
      case "yearly":
        end_date = new Date(res_date);
        end_date.setFullYear(end_date.getFullYear() + 1);
        break;
      default:
        return res.status(400).json({ message: "Invalid period selected." });
    }

    // Create New Admin
    const newAdmin = await Admin.create({
      dairy_name,
      email,
      password_hash,
      contact,
      address,
      payment_amount,
      periods,
      res_date,
      end_date,
    });

    res
      .status(201)
      .json({ message: "Admin registered successfully", admin: newAdmin });
  } catch (err) {
    console.error("Registration Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports.FetchALlAdmin = async (req, res) => {
  try {
    const admins = await Admin.findAll();
    res.status(200).json({ admins });
  } catch (err) {
    console.error("Error fetching admins:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports.updateAdminRequestStatus = async (req, res) => {
  try {
    const { request } = req.body;
    const { id } = req.params;

    // Validate input
    if (typeof request !== "boolean") {
      return res
        .status(400)
        .json({ message: "Invalid request status. It must be true or false." });
    }

    // Find the admin by ID
    const admin = await Admin.findByPk(id);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    // Update request status
    admin.request = request;
    await admin.save();

    res.json({ message: "Admin request status updated successfully.", admin });
  } catch (error) {
    console.error("Error updating admin request status:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports.updateAdminPayment = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate request body
    // const { error } = updateAdminPaymentSchema.validate(req.body, { abortEarly: false });
    // if (error) {
    //     return res.status(400).json({ message: error.details.map(err => err.message) });
    // }

    const { payment_amount, periods } = req.body;

    // Find the admin by ID
    const admin = await Admin.findByPk(id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    // Update payment status, period, and reset res_date to today's date
    admin.payment_amount = payment_amount;
    admin.periods = periods;
    admin.res_date = new Date(); // Set res_date to today

    // Calculate `end_date` based on `res_date`
    let end_date = new Date(admin.res_date);
    switch (periods) {
      case "monthly":
        end_date.setMonth(end_date.getMonth() + 1);
        break;
      case "quarterly":
        end_date.setMonth(end_date.getMonth() + 3);
        break;
      case "half-yearly":
        end_date.setMonth(end_date.getMonth() + 6);
        break;
      case "yearly":
        end_date.setFullYear(end_date.getFullYear() + 1);
        break;
      default:
        return res.status(400).json({ message: "Invalid period selected." });
    }

    admin.end_date = end_date.toISOString().split("T")[0]; // Store `end_date` in YYYY-MM-DD format
    admin.request = true;

    await admin.save();

    res.json({
      message: "Admin payment, period, and reset date updated successfully.",
      admin,
    });
  } catch (error) {
    console.error("Error updating admin payment:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports.resetPass = async (req, res) => {
  try {
    const { email, newpassword, confirmpass } = req.body;

    if (newpassword !== confirmpass) {
      return res.status(400).json({ message: "Passwords do not match!" });
    }

    let user;
    let role;

    // 🔹 Check in all tables
    user = await SuperAdmin.findOne({ where: { email } });
    if (user) role = "super_admin";

    if (!user) {
      user = await Admin.findOne({ where: { email } });
      if (user) role = "admin";
    }

    if (!user) {
      user = await DeliveryBoy.findOne({ where: { email } });
      if (user) role = "delivery_boy";
    }

    if (!user) {
      user = await User.findOne({ where: { email } });
      if (user) role = "user";
    }

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    // 🔹 Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newpassword, saltRounds);

    // 🔹 Update password in the correct table
    await user.update({ password_hash: hashedPassword });

    res.status(200).json({
      message: `Password updated successfully for ${role}!`,
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Server error!" });
  }
};

module.exports.sendemailOtp = async (req, res) => {
  sendEmail(req.body)
    .then((response) => res.send(response.message))
    .catch((error) => res.status(500).send(error.message));
};

