const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const moment = require("moment-timezone");
const SuperAdmin = require("../models/SuperAdmin");
const Admin = require("../models/Admin.js");
const User = require("../models/User.js");
const DeliveryBoy = require("../models/DeliveryBoy.js");
const Farmer = require("../models/Farmer");
const { sendEmail } = require("../utils/sendMail.js");
const { Op } = require("sequelize");
const { sequelize } = require("../config/db");
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
    // Debug logging
    console.log("🔍 Login request received:");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("Request headers:", req.headers['content-type']);
    
    let { identifier, password_hash } = req.body; // Accepts either email or contact

    // Trim whitespace from identifier
    if (identifier) {
      identifier = identifier.trim();
    }

    // More specific error messages
    if (!identifier && !password_hash) {
      return res
        .status(400)
        .json({ message: "Email/Contact and password are required" });
    }
    
    if (!identifier || identifier === "") {
      return res
        .status(400)
        .json({ message: "Email/Contact is required" });
    }
    
    if (!password_hash || password_hash === "") {
      return res
        .status(400)
        .json({ message: "Password is required" });
    }

    let user;
    let role;

    // Check SuperAdmin login
    console.log("🔍 Searching for SuperAdmin with identifier:", identifier);
    console.log("  - Identifier type:", typeof identifier);
    console.log("  - Identifier length:", identifier?.length);
    console.log("  - Identifier trimmed:", identifier?.trim());
    
    user = await SuperAdmin.findOne({
      where: { [Op.or]: [{ email: identifier }, { contact: identifier }] },
    });
    
    if (user) {
      role = "super_admin";
      console.log("✅ SuperAdmin found:");
      console.log("  - ID:", user.id);
      console.log("  - Email:", user.email);
      console.log("  - Contact:", user.contact);
    } else {
      console.log("❌ SuperAdmin not found for identifier:", identifier);
      // Try case-insensitive search
      const caseInsensitiveUser = await SuperAdmin.findOne({
        where: { 
          [Op.or]: [
            { email: { [Op.like]: identifier } },
            { contact: identifier }
          ] 
        },
      });
      if (caseInsensitiveUser) {
        console.log("⚠️  Found SuperAdmin with case-insensitive search:", caseInsensitiveUser.email);
        user = caseInsensitiveUser;
        role = "super_admin";
      } else {
        // List all superadmins for debugging
        const allSuperAdmins = await SuperAdmin.findAll({
          attributes: ['id', 'email', 'contact'],
          raw: true
        });
        console.log("  - All SuperAdmins in database:", JSON.stringify(allSuperAdmins, null, 2));
      }
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
      if (user) {
        role = "delivery_boy";
      }
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
            .json({ message: "Your request is currently pending. It may take up to 24 hours for approval. You will be able to log in once your request is approved. Please check back later." });
        }

        // Check if corresponding Admin (with same dairy_name) has status=true
        const admin = await Admin.findOne({ where: { dairy_name: user.dairy_name } });
        
        // Check if admin exists first
        if (!admin || !admin.request) {
          return res.status(403).json({
            message:
              "Login not allowed. Associated Admin's status is not approved.",
          });
        }
        
        // Check end_date against today's date using IST timezone
        if (admin.end_date) {
          const today = moment.tz("Asia/Kolkata").format("YYYY-MM-DD");
          const endDate = moment.tz(admin.end_date, "Asia/Kolkata").format("YYYY-MM-DD");
          if (today > endDate) {
            return res.status(403).json({
              message: "Login not allowed. Your access period has expired.",
            });
          }
        }
      }
    }

    // Check Farmer login
    if (!user) {
      user = await Farmer.findOne({
        where: { [Op.or]: [{ email: identifier }, { contact: identifier }] },
        include: [
          {
            model: Admin,
            as: "dairy",
            attributes: [
              "id",
              "dairy_name",
              "email",
              "contact",
              "address",
              "dairy_logo",
              "res_date",
              "end_date",
              "request",
              "cow_rate",
              "buffalo_rate",
              "pure_rate",
              "farmer_cow_rate",
              "farmer_buffalo_rate",
              "farmer_pure_rate",
              "delivery_charges",
              "upi_address",
              "bank_name",
              "branch_name",
              "account_number",
              "ifsc_code"
            ],
          },
        ],
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
      console.log("❌ No user found for identifier:", identifier);
      console.log("Searched in: SuperAdmin, Admin, DeliveryBoy, User, Farmer");
      return res
        .status(400)
        .json({ message: "Invalid email/contact or password" });
    }

    console.log("✅ User found!");
    console.log("  - Role:", role);
    console.log("  - Email:", user.email);
    console.log("  - Has password_hash:", !!user.password_hash);

    // Verify password
    console.log("🔐 Verifying password...");
    console.log("  - Password provided length:", password_hash?.length || 0);
    console.log("  - Password provided (first 3 chars):", password_hash?.substring(0, 3) || "null");
    console.log("  - Password provided (last 3 chars):", password_hash?.substring(password_hash.length - 3) || "null");
    console.log("  - Stored hash length:", user.password_hash?.length || 0);
    
    // Test with the expected password for debugging
    const expectedPassword = "pass-super@123";
    console.log("  - Expected password length:", expectedPassword.length);
    console.log("  - Provided password matches expected length:", password_hash?.length === expectedPassword.length);
    
    const isMatch = await bcrypt.compare(password_hash, user.password_hash);
    
    if (!isMatch) {
      console.log("❌ Password verification FAILED!");
      console.log("  - Identifier:", identifier);
      console.log("  - Role:", role);
      console.log("  - Provided password:", password_hash);
      console.log("  - Expected password length:", expectedPassword.length);
      console.log("  - Provided password length:", password_hash?.length);
      
      // Try with expected password for debugging
      const testMatch = await bcrypt.compare(expectedPassword, user.password_hash);
      console.log("  - Test with expected password:", testMatch ? "✅ MATCHES" : "❌ DOES NOT MATCH");
      
      return res
        .status(400)
        .json({ message: "Invalid email/contact or password" });
    }
    
    console.log("✅ Password verified successfully!");

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

    // For farmer login, extract dairy details separately
    let dairyDetails = null;
    if (role === "farmer" && userData.dairy) {
      dairyDetails = userData.dairy;
      // Don't delete the dairy from userData, keep it for backward compatibility
    }

    const response = { 
      message: "Login successful", 
      token, 
      role, 
      user: userData 
    };

    // Add dairy details if farmer
    if (dairyDetails) {
      response.dairy = dairyDetails;
    }

    res.json(response);
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

    // Handle dairy logo if uploaded
    let dairy_logo = null;
    if (req.file) {
      dairy_logo = req.file.buffer; // Store as binary data
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
      dairy_logo,
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

// Test Festival Greetings (for testing purposes)
module.exports.testFestivalGreetings = async (req, res) => {
  try {
    const { testDate } = req.body; // Optional: YYYY-MM-DD format, if not provided uses today
    
    // Import festival greetings function
    const { checkAndSendFestivalGreetings } = require("../cron/festivalGreetings");
    const { getFestivalForDate } = require("../utils/festivals");
    const moment = require("moment-timezone");
    
    // Use provided date or today
    const dateToTest = testDate || moment.tz("Asia/Kolkata").format("YYYY-MM-DD");
    
    // Check if there's a festival on this date
    const festival = getFestivalForDate(dateToTest);
    
    if (!festival) {
      return res.status(200).json({
        message: `No festival found for date: ${dateToTest}`,
        testDate: dateToTest,
        festival: null,
        suggestion: "Try testing with 2026-01-26 for Republic Day"
      });
    }
    
    // Temporarily override the date check in the function
    // We'll call the function directly which will use today, so we need to modify the logic
    const originalCheck = require("../cron/festivalGreetings").checkAndSendFestivalGreetings;
    
    // Create a modified version that uses the test date
    const User = require("../models/User");
    const admin = require("../utils/firebase");
    const { sendFestivalGreeting } = require("../cron/festivalGreetings");
    
    console.log(`[TEST] Testing festival greetings for ${festival.name} on ${dateToTest}`);
    
    // Fetch all active CUSTOMERS ONLY (User model = customers, not admins)
    const activeUsers = await User.findAll({
      where: {
        request: true, // Only approved customers
      },
      attributes: ['id', 'name', 'email', 'fcm_token'],
    });
    
    console.log(`[TEST] Found ${activeUsers.length} active customers`);
    
    let successCount = 0;
    let failureCount = 0;
    let skippedCount = 0;
    const results = [];
    
    // Send greetings to all active users
    for (const user of activeUsers) {
      const result = await sendFestivalGreeting(user, festival);
      
      results.push({
        userId: user.id,
        userName: user.name,
        email: user.email,
        result: result.success ? 'success' : (result.reason || 'failed'),
        successCount: result.successCount || 0,
        failureCount: result.failureCount || 0
      });
      
      if (result.success) {
        successCount++;
      } else if (result.reason === "no_token" || result.reason === "no_valid_tokens") {
        skippedCount++;
      } else {
        failureCount++;
      }
    }
    
    res.status(200).json({
      message: `Festival greetings test completed for ${festival.name}`,
      testDate: dateToTest,
      festival: {
        name: festival.name,
        date: festival.date,
        greeting: festival.greeting
      },
      statistics: {
        totalCustomers: activeUsers.length,
        successful: successCount,
        failed: failureCount,
        skipped: skippedCount
      },
      results: results.slice(0, 10), // Show first 10 results
      note: skippedCount > 0 ? `${skippedCount} customers don't have FCM tokens registered. They need to register their tokens first.` : null
    });
    
  } catch (error) {
    console.error("Error testing festival greetings:", error);
    res.status(500).json({
      message: "Error testing festival greetings",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
