const express = require("express");

const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const Admin = require("../models/Admin");
const User = require("../models/User");
const SuperAdmin = require("../models/SuperAdmin");
const DeliveryBoy = require("../models/DeliveryBoy");
const DeliveryStatus = require("../models/DeliveryStatus");
const AdditionalOrder = require("../models/additinalOrder");
const Farmer = require("../models/Farmer");
const DailyFarmerOrder = require("../models/DailyFarmerOrder");
const FarmerPayment = require("../models/FarmerPayment");
const Vacation = require("../models/vacations");

const { Op, fn, col, Sequelize } = require("sequelize");
const { sequelize } = require("../models"); // adjust the path as needed
const upload = require("../middlewares/multer");
const moment = require("moment-timezone");
const PaymentDetails = require("../models/payment_details"); // Import PaymentDetails+
const { start } = require("repl");
const DeliveryBoyMilkDistribution = require("../models/DeliveryBoyMilkDistribution");
const SubscriptionPlan = require("../models/SubscriptionPlan");

module.exports.checkAdmin = async (req, res) => {
  try {
    const { dairy_name, email, contact } = req.body;
    if (!dairy_name || !email || !contact) {
      return res
        .status(400)
        .json({ message: "Email and contact are required" });
    }
    const dairyNameExits = await Admin.findOne({ where: { dairy_name } });
    if (dairyNameExits) {
      return res
        .status(400)
        .json({ message: "Dairy Name already exists in another role." });
    }
    // Check if email exists in any table
    const emailExists = await Promise.all([
      DeliveryBoy.findOne({ where: { email } }),
      SuperAdmin.findOne({ where: { email } }),
      Admin.findOne({ where: { email } }),
      User.findOne({ where: { email } }),
      Farmer.findOne({ where: { email } }),
    ]);

    if (emailExists.some((user) => user !== null)) {
      return res
        .status(400)
        .json({ message: "Email already exists in another role." });
    }

    //Check if contact exists in any table
    const contactExists = await Promise.all([
      DeliveryBoy.findOne({ where: { contact } }),
      SuperAdmin.findOne({ where: { contact } }),
      Admin.findOne({ where: { contact } }),
      User.findOne({ where: { contact } }),
      Farmer.findOne({ where: { contact } }),
    ]);

    if (contactExists.some((user) => user !== null)) {
      return res
        .status(400)
        .json({ message: "Contact number already exists in another role." });
    }

    // If both checks pass, proceed
    res.status(200).json({ message: "User not found, proceed to checkout" });
  } catch (err) {
    console.error("Error checking user:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.userDashPay = async (req, res) => {
  try {
    if (!req.body.amount) {
      return res.status(400).json({ message: "Amount is required" });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error("Razorpay credentials not configured");
      return res.status(500).json({ message: "Payment gateway not configured" });
    }

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    
    const order = await instance.orders.create({
      amount: Number(req.body.amount * 100),
      currency: "INR",
      receipt: "receipt#1",
    });

    res.status(200).json({ success: true, order: order });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    
    // Handle specific Razorpay authentication errors
    if (error.statusCode === 401 || error.error?.code === "BAD_REQUEST_ERROR") {
      console.error("⚠️  Razorpay authentication failed!");
      console.error("   Please verify RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env file");
      console.error("   Get new credentials from: https://dashboard.razorpay.com/app/keys");
      
      return res.status(500).json({ 
        message: "Razorpay authentication failed. Please check your API credentials.",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    res.status(500).json({ 
      message: "Error creating payment order", 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

module.exports.paymentVerification = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res
        .status(400)
        .json({ message: "Missing required payment details" });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const payment = await instance.payments.fetch(razorpay_payment_id);
    if (!payment || !payment.notes) {
      return res.status(400).json({ message: "Invalid payment details" });
    }

    const Userdata = payment.notes;

    function capitalizeEachWord(text) {
      return text.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
    }

    Userdata.dairy_name = capitalizeEachWord(Userdata.dairy_name);
    Userdata.payment_amount = Userdata.amount;
    Userdata.res_date = moment.tz("Asia/Kolkata").format("YYYY-MM-DD");
    let end_date;
    switch (Userdata.periods) {
      case "monthly":
        end_date = new Date(Userdata.res_date);
        end_date.setMonth(end_date.getMonth() + 1);
        break;
      case "quarterly":
        end_date = new Date(Userdata.res_date);
        end_date.setMonth(end_date.getMonth() + 3);
        break;
      case "half-yearly":
        end_date = new Date(Userdata.res_date);
        end_date.setMonth(end_date.getMonth() + 6);
        break;
      case "yearly":
        end_date = new Date(Userdata.res_date);
        end_date.setFullYear(end_date.getFullYear() + 1);
        break;
      default:
        return res.status(400).json({ message: "Invalid period selected." });
    }
    Userdata.end_date = end_date.toISOString().split("T")[0];

    const admin = await Admin.create(Userdata);
    const token = jwt.sign(
      { id: admin.id, email: admin.email, dairy_name: admin.dairy_name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Determine frontend URL dynamically
    let frontendUrl = process.env.FRONTEND_URL;
    
    // If not set in env, try to get from request headers or payment notes
    if (!frontendUrl) {
      // Try to get from payment notes (if stored during order creation)
      if (payment.notes && payment.notes.frontend_url) {
        frontendUrl = payment.notes.frontend_url;
      }
      // Try to get from referer or origin header
      else {
        const referer = req.headers.referer || req.headers.origin;
        if (referer) {
          try {
            const url = new URL(referer);
            frontendUrl = `${url.protocol}//${url.host}`;
          } catch (e) {
            console.warn("Could not parse referer URL:", referer);
          }
        }
        // Try to construct from request host (for Razorpay callbacks)
        else if (req.headers.host) {
          const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
          // For Razorpay callbacks, we need to determine frontend URL
          // Check if host contains backend domain and construct frontend URL
          const host = req.headers.host;
          // If backend is on a subdomain or different port, adjust accordingly
          // For now, use the same host but you may need to adjust based on your setup
          if (host.includes('api.') || host.includes(':5001') || host.includes(':3000')) {
            // Backend domain detected, construct frontend URL
            frontendUrl = host.replace('api.', '').replace(':5001', '').replace(':3000', '');
            frontendUrl = `${protocol}://${frontendUrl}`;
          } else {
            frontendUrl = `${protocol}://${host}`;
          }
        }
      }
    }
    
    // Fallback to localhost only in development
    if (!frontendUrl) {
      frontendUrl = process.env.NODE_ENV === 'production' 
        ? 'https://yourdomain.com' // Replace with your actual production domain
        : "http://localhost:5173";
    }
    
    console.log("🔄 Redirecting to frontend URL:", frontendUrl);
    res.redirect(frontendUrl);
  } catch (err) {
    console.error("Error in payment verification:", err);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

module.exports.userDashSubscriptionPay = async (req, res) => {
  try {
    if (!req.body.amount) {
      return res.status(400).json({ message: "Amount is required" });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error("Razorpay credentials not configured");
      return res.status(500).json({ message: "Payment gateway not configured" });
    }

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    
    const order = await instance.orders.create({
      amount: Number(req.body.amount * 100),
      currency: "INR",
      receipt: "receipt#1",
    });

    res.status(200).json({ success: true, order: order });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ 
      message: "Error creating payment order", 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

module.exports.paymentVerificationSubscription = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res
        .status(400)
        .json({ message: "Missing required payment details" });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const payment = await instance.payments.fetch(razorpay_payment_id);
    if (!payment || !payment.notes) {
      return res.status(400).json({ message: "Invalid payment details" });
    }

    const Userdata = payment.notes;
    function capitalizeEachWord(text) {
      return text.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
    }

    Userdata.dairy_name = capitalizeEachWord(Userdata.dairy_name);
    Userdata.payment_amount = Userdata.amount;
    
    // Set res_date to today (start of subscription)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day to avoid timezone issues
    Userdata.res_date = today.toISOString().split("T")[0];

    // Calculate end_date based on res_date and period
    let end_date = new Date(today); // Start from today
    switch (Userdata.periods) {
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
    end_date.setHours(0, 0, 0, 0); // Set to start of day
    Userdata.end_date = end_date.toISOString().split("T")[0];
    
    console.log("📅 Calculating subscription dates:", {
      res_date: Userdata.res_date,
      end_date: Userdata.end_date,
      period: Userdata.periods
    });

    // 🔹 Check if admin already exists (based on email)
    const existingAdmin = await Admin.findOne({
      where: { email: Userdata.email },
    });

    if (existingAdmin) {
      // 🔹 If admin exists, update their subscription details
      const updateResult = await Admin.update(
        {
          payment_amount: Userdata.payment_amount,
          res_date: Userdata.res_date,
          end_date: Userdata.end_date,
          periods: Userdata.periods,
        },
        { where: { email: Userdata.email } }
      );
      
      // Verify the update was successful
      const updatedAdmin = await Admin.findOne({
        where: { email: Userdata.email },
        attributes: ["res_date", "end_date", "periods"],
        raw: true,
      });
      
      console.log("✅ Subscription updated successfully for:", Userdata.email);
      console.log("   New res_date:", updatedAdmin?.res_date);
      console.log("   New end_date:", updatedAdmin?.end_date);
      console.log("   Period:", updatedAdmin?.periods);
      console.log("   Update result:", updateResult[0] > 0 ? "Success" : "Failed");
      
      // Verify end_date was updated correctly (compare date strings, not full datetime)
      const expectedEndDate = Userdata.end_date.split("T")[0];
      const actualEndDate = updatedAdmin?.end_date ? 
        (updatedAdmin.end_date.split ? updatedAdmin.end_date.split("T")[0] : new Date(updatedAdmin.end_date).toISOString().split("T")[0]) : 
        null;
      
      if (!updatedAdmin || actualEndDate !== expectedEndDate) {
        console.error("⚠️ WARNING: Database update may not have been applied correctly!");
        console.error("   Expected end_date:", expectedEndDate);
        console.error("   Actual end_date:", actualEndDate);
        
        // Try to fix it by updating again
        console.log("🔄 Attempting to fix end_date...");
        try {
          await Admin.update(
            { end_date: Userdata.end_date },
            { where: { email: Userdata.email } }
          );
          console.log("✅ End_date fixed!");
        } catch (fixError) {
          console.error("❌ Failed to fix end_date:", fixError.message);
        }
      } else {
        console.log("✅ End_date verified correctly!");
      }
    } else {
      console.error("❌ Admin not found with email:", Userdata.email);
      return res.status(404).json({ message: "Admin not found" });
    }

    const token = jwt.sign(
      {
        id: existingAdmin.id,
        email: Userdata.email,
        dairy_name: Userdata.dairy_name,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Determine frontend URL dynamically
    let frontendUrl = process.env.FRONTEND_URL;
    
    // If not set in env, try to get from request headers or payment notes
    if (!frontendUrl) {
      // Try to get from payment notes (if stored during order creation)
      if (payment.notes && payment.notes.frontend_url) {
        frontendUrl = payment.notes.frontend_url;
      }
      // Try to get from referer or origin header
      else {
        const referer = req.headers.referer || req.headers.origin;
        if (referer) {
          try {
            const url = new URL(referer);
            frontendUrl = `${url.protocol}//${url.host}`;
          } catch (e) {
            console.warn("Could not parse referer URL:", referer);
          }
        }
        // Try to construct from request host (for Razorpay callbacks)
        else if (req.headers.host) {
          const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
          // For Razorpay callbacks, we need to determine frontend URL
          // Check if host contains backend domain and construct frontend URL
          const host = req.headers.host;
          // If backend is on a subdomain or different port, adjust accordingly
          // For now, use the same host but you may need to adjust based on your setup
          if (host.includes('api.') || host.includes(':5001') || host.includes(':3000')) {
            // Backend domain detected, construct frontend URL
            frontendUrl = host.replace('api.', '').replace(':5001', '').replace(':3000', '');
            frontendUrl = `${protocol}://${frontendUrl}`;
          } else {
            frontendUrl = `${protocol}://${host}`;
          }
        }
      }
    }
    
    // Fallback to localhost only in development
    if (!frontendUrl) {
      frontendUrl = process.env.NODE_ENV === 'production' 
        ? 'https://yourdomain.com' // Replace with your actual production domain
        : "http://localhost:5173";
    }
    
    console.log("🔄 Redirecting to frontend URL:", `${frontendUrl}/admin-dashboard?payment=success`);
    res.redirect(`${frontendUrl}/admin-dashboard?payment=success`);
  } catch (err) {
    console.error("Error in payment verification:", err);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

module.exports.addRate = async (req, res) => {
  try {
    const { cow_rate, buffalo_rate, pure_rate } = req.body;
    let delivery_charges = req.body.delivery_charges;
    // Extract dairy_name from JWT token
    const { dairy_name } = req.user;

    // Check if the Admin exists
    const admin = await Admin.findOne({ where: { dairy_name } });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Create an object with only valid non-negative numbers to update
    const updateFields = {};
    
    // Helper function to parse and validate numeric values
    const parseRate = (value, fieldName) => {
      if (value === undefined || value === null || value === "") {
        return null;
      }
      // Convert to number (handles both string and number inputs)
      const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
      
      // Check if it's a valid number
      if (isNaN(numValue) || !isFinite(numValue)) {
        throw new Error(`${fieldName} must be a valid number.`);
      }
      
      // Check if it's non-negative
      if (numValue < 0) {
        throw new Error(`${fieldName} must be a non-negative number.`);
      }
      
      // Round to 2 decimal places to match DECIMAL(10,2) if that's what the DB uses
      return Math.round(numValue * 100) / 100;
    };

    // Parse and validate each rate
    if (cow_rate !== undefined && cow_rate !== null && cow_rate !== "") {
      try {
        updateFields.cow_rate = parseRate(cow_rate, "Cow rate");
      } catch (error) {
        return res.status(400).json({ message: error.message });
      }
    }
    
    if (buffalo_rate !== undefined && buffalo_rate !== null && buffalo_rate !== "") {
      try {
        updateFields.buffalo_rate = parseRate(buffalo_rate, "Buffalo rate");
      } catch (error) {
        return res.status(400).json({ message: error.message });
      }
    }
    
    if (pure_rate !== undefined && pure_rate !== null && pure_rate !== "") {
      try {
        updateFields.pure_rate = parseRate(pure_rate, "Pure rate");
      } catch (error) {
        return res.status(400).json({ message: error.message });
      }
    }
    
    // Handle delivery_charges
    if (delivery_charges === "" || delivery_charges === null || delivery_charges === undefined) {
      updateFields.delivery_charges = 0;
    } else {
      try {
        updateFields.delivery_charges = parseRate(delivery_charges, "Delivery charges");
      } catch (error) {
        return res.status(400).json({ message: error.message });
      }
    }

    // If no valid updates are provided, return an error
    if (Object.keys(updateFields).length === 0) {
      return res
        .status(400)
        .json({ message: "No valid rate provided for update." });
    }

    // Log the values being updated for debugging
    console.log("Updating rates:", updateFields);

    // Update only the provided fields
    await admin.update(updateFields);

    return res.status(200).json({
      message: "Rates updated successfully",
      updatedRates: updateFields,
    });
  } catch (error) {
    console.error("Error updating rates:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports.updatePaymentDetails = async (req, res) => {
  try {
    const { upi_address, bank_name, branch_name, account_number, ifsc_code } =
      req.body;

    // Extract admin ID from JWT token
    const adminId = req.user.id;

    if (req.file) {
      qr_image = req.file.buffer; // Store image as buffer
    }

    if (
      !upi_address ||
      !bank_name ||
      !branch_name ||
      !account_number ||
      !ifsc_code
    ) {
      return res.status(400).json({ message: "Required information missing" });
    }

    const admin = await Admin.findByPk(adminId);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    admin.qr_image = qr_image || admin.qr_image;
    admin.upi_address = upi_address || admin.upi_address;
    admin.bank_name = bank_name || admin.bank_name;
    admin.branch_name = branch_name || admin.branch_name;
    admin.account_number = account_number || admin.account_number;
    admin.ifsc_code = ifsc_code || admin.ifsc_code;

    await admin.save({ validate: false });

    res
      .status(200)
      .json({ message: "Payment details updated successfully", admin });
  } catch (error) {
    res.status(500).json({
      message: "Error updating payment details",
      error: error.message,
    });
  }
};

module.exports.fetchAllUsers = async (req, res) => {
  try {
    // Extract admin's dairy name from the authenticated request
    const { dairy_name } = req.user;

    if (!dairy_name) {
      return res
        .status(403)
        .json({ message: "Unauthorized: No dairy association found" });
    }

    // Fetch users whose request status is true under this admin's dairy
    const users = await User.findAll({
      where: {
        dairy_name,
        request: true,
      },
      attributes: { exclude: ["password_hash"] },
    });

    res.json({
      message: "Users with active requests fetched successfully",
      users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports.addNewUser = async (req, res) => {
  try {
    const { dairy_name } = req.user; // Extract admin's dairy name
    const {
      name,
      email,
      password_hash,
      contact,
      address,
      milk_type,
      quantity,
      shift,
    } = req.body;

    // 🔹 Check if email exists in any table
    const emailExists = await Promise.all([
      DeliveryBoy.findOne({ where: { email } }),
      SuperAdmin.findOne({ where: { email } }),
      Admin.findOne({ where: { email } }),
      User.findOne({ where: { email } }),
      Farmer.findOne({ where: { email } }),
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
      Farmer.findOne({ where: { contact } }),
    ]);

    if (contactExists.some((user) => user !== null)) {
      return res
        .status(400)
        .json({ message: "Contact number already exists in another role." });
    }

    // Determine vacation mode based on shift
    let vacation_mode_morning = false;
    let vacation_mode_evening = false;

    if (shift === "morning") {
      vacation_mode_evening = true;
    } else if (shift === "evening") {
      vacation_mode_morning = true;
    }

    // ✅ Create New User
    const newUser = await User.create({
      name,
      email,
      password_hash,
      contact,
      address,
      dairy_name,
      milk_type,
      quantity,
      request: true,
      shift,
      vacation_mode_morning,
      vacation_mode_evening,
    });

    // ✅ Set start_date to today for immediate activation
    let startDate = moment.tz("Asia/Kolkata").format("YYYY-MM-DD");
    let yearMonth = moment.tz(startDate, "Asia/Kolkata").format("YYYY-MM"); // Extract YYYY-MM from start_date

    // ✅ Update user with start_date
    await newUser.update({ start_date: startDate });

    // ✅ Create Payment Details with year_month field
    const new_Payment_Details = await PaymentDetails.create({
      userid: newUser.id,
      start_date: startDate, // Set start date as today for immediate activation
      month_year: yearMonth, // Store the year and month in YYYY-MM format
    });

    return res.status(201).json({
      message: "User added successfully.",
      user: newUser,
      paymentDetails: new_Payment_Details,
    });
  } catch (error) {
    console.error("Error adding user:", error);
    return res
      .status(500)
      .json({ error: "Server error. Please try again later." });
  }
};

module.exports.updateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { request } = req.body;
    const { dairy_name } = req.user; // Extract admin's dairy name

    // Validate request input (must be true or false)
    if (typeof request !== "boolean") {
      return res
        .status(400)
        .json({ message: "Invalid request value. Must be true or false." });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.dairy_name !== dairy_name) {
      return res.status(403).json({
        message: "Unauthorized: You can only update users from your own dairy",
      });
    }

    // Update request status
    user.request = request;

    // Set start_date to today for immediate activation
    user.start_date = moment()
      .tz("Asia/Kolkata")
      .format("YYYY-MM-DD");
    await user.save();
    let startDate = moment()
      .tz("Asia/Kolkata")
      .format("YYYY-MM-DD");
    let yearMonth = moment(startDate).format("YYYY-MM"); // Extract YYYY-MM from start_date
    const new_Payment_Details = await PaymentDetails.create({
      userid: user.id,
      start_date: startDate, // ✅ Set start date as today for immediate activation
      month_year: yearMonth,
    });

    res.json({
      message: "Request status and start date updated successfully",
      user,
      new_Payment_Details,
    });
  } catch (error) {
    console.error("Error updating request status:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports.fetchPendingRequest = async (req, res) => {
  try {
    const { dairy_name } = req.user;

    if (!dairy_name) {
      return res.status(400).json({ message: "Dairy name is required." });
    }

    const users = await User.findAll({
      where: {
        request: false,
        dairy_name: dairy_name,
      },
      attributes: { exclude: ["password_hash"] },
    });

    res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports.registerDeliveryBoy = async (req, res) => {
  try {
    const { name, email, contact, address, password_hash } = req.body;

    // 🔹 Extract dairy_name from the authenticated admin
    const { dairy_name } = req.user;
    if (!dairy_name) {
      return res
        .status(403)
        .json({ message: "Unauthorized: No dairy association found." });
    }

    // 🔹 Check if a delivery boy is already registered for this dairy
    const existingDeliveryBoy = await DeliveryBoy.findOne({
      where: { dairy_name },
    });
    if (existingDeliveryBoy) {
      return res.status(400).json({
        message: "A delivery boy is already registered for this dairy.",
      });
    }

    // 🔹 Check if email exists in any table
    const emailExists = await Promise.all([
      DeliveryBoy.findOne({ where: { email } }),
      SuperAdmin.findOne({ where: { email } }),
      Admin.findOne({ where: { email } }),
      User.findOne({ where: { email } }),
      Farmer.findOne({ where: { email } }),
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
      Farmer.findOne({ where: { contact } }),
    ]);

    if (contactExists.some((user) => user !== null)) {
      return res
        .status(400)
        .json({ message: "Contact number already exists in another role." });
    }

    // 🔹 Create new delivery boy entry
    const newDeliveryBoy = await DeliveryBoy.create({
      name,
      email,
      contact,
      address,
      password_hash,
      status: 1,
      dairy_name, // Automatically taken from admin's token
    });

    res.status(201).json({
      message: "Delivery boy registered successfully!",
      deliveryBoy: newDeliveryBoy,
    });
  } catch (error) {
    console.error("Error registering delivery boy:", error);
    res.status(500).json({ message: "Server error." });
  }
};

module.exports.fetchDeliveryBoy = async (req, res) => {
  try {
    // Extract admin's dairy name from the authenticated request
    const { dairy_name } = req.user;

    if (!dairy_name) {
      return res
        .status(403)
        .json({ message: "Unauthorized: No dairy association found" });
    }

    // Fetch users whose request status is true under this admin's dairy
    const deliveryBoys = await DeliveryBoy.findAll({
      where: { dairy_name },
      attributes: { exclude: ["password_hash"] },
    });

    if (deliveryBoys.length === 0) {
      return res.status(404).json({ message: "No delivery boys found" });
    }

    res.json({
      message: "Users with active requests fetched successfully",
      deliveryBoys,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports.deleteDeliveryBoy = async (req, res) => {
  try {
    const { id } = req.params;
    const { dairy_name } = req.user; // Extract the admin's dairy_name from JWT

    if (!dairy_name) {
      return res
        .status(403)
        .json({ message: "Unauthorized: No dairy association found." });
    }

    // Find the delivery boy
    const deliveryBoy = await DeliveryBoy.findOne({ where: { id } });

    if (!deliveryBoy) {
      return res.status(404).json({ message: "Delivery boy not found." });
    }

    // Ensure the delivery boy belongs to the requesting admin's dairy
    if (deliveryBoy.dairy_name !== dairy_name) {
      return res.status(403).json({
        message: "Unauthorized: You can only delete your own delivery boy.",
      });
    }

    // Delete the delivery boy
    await deliveryBoy.destroy();

    res.status(200).json({ message: "Delivery boy deleted successfully!" });
  } catch (error) {
    console.error("Error deleting delivery boy:", error);
    res.status(500).json({ message: "Server error." });
  }
};

module.exports.dairyList = async function getDairyList(req, res) {
  try {
    const Dairy = await Admin.findAll({
      attributes: ["dairy_name", "address", "res_date"],
    });
    res.status(200).json({ Dairy: Dairy });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params; // Get user ID from request parameters

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.destroy(); // Delete the user

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error" });
  }
};
module.exports.resDate = async (req, res) => {
  try {
    const { dairy_name } = req.user; // Extracting dairy_name from JWT token

    if (!dairy_name) {
      return res.status(400).json({ message: "Dairy name is required." });
    }

    // Use raw SQL query to safely check if end_date column exists
    const sequelize = Admin.sequelize;
    let admin;
    
    try {
      // First, try to get all columns (Sequelize will handle missing columns)
      admin = await Admin.findOne({
        where: { dairy_name },
        raw: true,
      });

      if (!admin) {
        return res.status(404).json({ message: "Admin not found." });
      }

      // Extract only the fields we need
      const res_date = admin.res_date;
      const periods = admin.periods;
      let end_date = admin.end_date || null;

      // If end_date is null or missing, calculate it from res_date and periods
      if (!end_date && res_date && periods) {
        const resDate = new Date(res_date);
        const calculatedEndDate = new Date(resDate);
        
        switch (periods) {
          case "monthly":
            calculatedEndDate.setMonth(calculatedEndDate.getMonth() + 1);
            break;
          case "quarterly":
            calculatedEndDate.setMonth(calculatedEndDate.getMonth() + 3);
            break;
          case "half-yearly":
            calculatedEndDate.setMonth(calculatedEndDate.getMonth() + 6);
            break;
          case "yearly":
            calculatedEndDate.setFullYear(calculatedEndDate.getFullYear() + 1);
            break;
          default:
            console.warn("⚠️ Unknown period type:", periods);
        }
        
        end_date = calculatedEndDate.toISOString().split("T")[0];
        
        // Try to update the database with calculated end_date (only if column exists)
        try {
          // Check if end_date column exists by trying to update it
          await sequelize.query(
            `UPDATE admin_registration SET end_date = :endDate WHERE dairy_name = :dairyName`,
            {
              replacements: { endDate: calculatedEndDate, dairyName: dairy_name },
              type: sequelize.QueryTypes.UPDATE
            }
          );
          console.log("✅ Calculated and updated end_date for:", dairy_name);
        } catch (updateError) {
          // Column might not exist, that's okay - we'll use calculated value
          console.warn("⚠️ Could not update end_date (column may not exist):", updateError.message);
        }
      }

      // Return both res_date, end_date, and periods
      res.json({ 
        res_date: res_date, 
        end_date: end_date,
        periods: periods 
      });
    } catch (queryError) {
      console.error("❌ Database query error:", queryError.message);
      console.error("Error stack:", queryError.stack);
      throw queryError;
    }
  } catch (error) {
    console.error("❌ Error fetching admin data:", error.message);
    console.error("Error stack:", error.stack);
    res.status(500).json({ 
      message: "Internal server error.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get detailed subscription plan information for admin
module.exports.getSubscriptionDetails = async (req, res) => {
  try {
    const { dairy_name } = req.user;

    if (!dairy_name) {
      return res.status(400).json({ message: "Dairy name is required." });
    }

    // Get admin subscription details
    const admin = await Admin.findOne({
      where: { dairy_name },
      raw: true,
    });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    const { res_date, end_date, periods, payment_amount } = admin;

    // Calculate actual validity days from res_date and end_date
    let actualValidityDays = null;
    if (res_date && end_date) {
      try {
        // Handle both Date objects and date strings
        const startDate = moment.tz(res_date, "Asia/Kolkata").startOf("day");
        const endDate = moment.tz(end_date, "Asia/Kolkata").startOf("day");
        
        // Validate dates
        if (startDate.isValid() && endDate.isValid()) {
          actualValidityDays = Math.ceil(endDate.diff(startDate, "days", true));
        }
      } catch (error) {
        console.error("Error calculating validity days:", error);
      }
    }

    // Map period to validity days (for backward compatibility)
    const periodToDays = {
      monthly: 30,
      quarterly: 90,
      "half-yearly": 180,
      yearly: 365
    };

    // Use actual validity days if available, otherwise fall back to period mapping
    const validityDays = actualValidityDays || periodToDays[periods] || 30;

    // Find matching subscription plan based on validity days
    // Always try to find the closest match based on actual validity days
    let subscriptionPlan = null;
    
    // Get all active plans
    const allPlans = await SubscriptionPlan.findAll({
      where: { is_active: true },
      order: [['plan_validity_days', 'ASC']]
    });

    if (actualValidityDays && allPlans.length > 0) {
      // Find the plan with validity days closest to actual validity
      let closestPlan = null;
      let minDiff = Infinity;
      
      for (const plan of allPlans) {
        const diff = Math.abs(plan.plan_validity_days - actualValidityDays);
        if (diff < minDiff) {
          minDiff = diff;
          closestPlan = plan;
        }
      }
      
      subscriptionPlan = closestPlan;
    } else if (allPlans.length > 0) {
      // Fallback: use period mapping if actual validity not available
      subscriptionPlan = await SubscriptionPlan.findOne({
        where: { 
          plan_validity_days: validityDays,
          is_active: true
        }
      });
    }

    // Calculate days remaining
    let daysRemaining = 0;
    let status = "expired";
    const today = moment.tz("Asia/Kolkata").startOf("day");
    
    if (end_date) {
      const endDate = moment.tz(end_date, "Asia/Kolkata").startOf("day");
      daysRemaining = Math.ceil(endDate.diff(today, "days", true));
      status = daysRemaining > 0 ? "active" : "expired";
    }

    // Format dates
    const formatDate = (dateStr) => {
      if (!dateStr) return null;
      return moment.tz(dateStr, "Asia/Kolkata").format("DD MMM YYYY");
    };

    // Check if plan matches actual validity (allow 30 days tolerance for yearly plans)
    const planMatches = subscriptionPlan && actualValidityDays 
      ? Math.abs(subscriptionPlan.plan_validity_days - actualValidityDays) <= 30
      : true;

    // If no plan found but we have actual validity, try to find any plan
    if (!subscriptionPlan && actualValidityDays && allPlans.length > 0) {
      // Just get the first available plan as fallback
      subscriptionPlan = allPlans[0];
      console.log("⚠️ No close match found, using first available plan:", subscriptionPlan.plan_name);
    }

    // Prepare response
    const subscriptionDetails = {
      plan: subscriptionPlan ? {
        id: subscriptionPlan.id,
        plan_name: subscriptionPlan.plan_name,
        plan_price: subscriptionPlan.plan_price,
        plan_validity_days: subscriptionPlan.plan_validity_days,
        plan_features: subscriptionPlan.plan_features ? JSON.parse(subscriptionPlan.plan_features) : [],
        badge: subscriptionPlan.badge,
        show_gst: subscriptionPlan.show_gst,
        gst_percentage: subscriptionPlan.gst_percentage,
        matches_actual_period: planMatches,
        actual_validity_days: actualValidityDays
      } : null,
      subscription: {
        period: periods,
        actual_validity_days: actualValidityDays,
        start_date: formatDate(res_date),
        end_date: formatDate(end_date),
        next_billing_date: formatDate(end_date), // Next billing date is the end date
        days_remaining: daysRemaining,
        status: status,
        payment_amount: payment_amount || 0
      },
      warning: actualValidityDays && subscriptionPlan && !planMatches 
        ? `Note: Your actual subscription period (${actualValidityDays} days) doesn't exactly match the plan (${subscriptionPlan.plan_validity_days} days).`
        : null
    };

    res.status(200).json({
      success: true,
      message: "Subscription details fetched successfully",
      data: subscriptionDetails
    });
  } catch (error) {
    console.error("Error fetching subscription details:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports.profile = async (req, res) => {
  try {
    const { dairy_name } = req.user; // Extracting dairy_name from JWT token

    if (!dairy_name) {
      return res.status(400).json({ message: "Dairy name is required." });
    }

    // Fetch all columns without specifying attributes to avoid column errors
    const admin = await Admin.findOne({
      where: { dairy_name },
      raw: true, // Get plain object
    });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    // Extract only the fields we need, handle missing end_date
    const profileData = {
      dairy_name: admin.dairy_name,
      email: admin.email,
      contact: admin.contact,
      address: admin.address,
      res_date: admin.res_date,
      end_date: admin.end_date || null, // Handle missing end_date
      payment_amount: admin.payment_amount,
      // Include customer milk rates
      cow_rate: admin.cow_rate || 0,
      buffalo_rate: admin.buffalo_rate || 0,
      pure_rate: admin.pure_rate || 0,
      delivery_charges: admin.delivery_charges || 0,
    };

    res.json(profileData);
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ 
      message: "Internal server error.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
module.exports.updateProfile = async (req, res) => {
  try {
    const { dairy_name } = req.user; // Extracting dairy_name from JWT token
    let { email, contact, address, new_dairy_name } = req.body; // Fields to update

    if (!dairy_name) {
      return res.status(400).json({ message: "Dairy name is required." });
    }

    // Trim inputs
    email = email?.trim();
    contact = contact?.trim();
    address = address?.trim();
    new_dairy_name = new_dairy_name?.trim();

    // Find the current admin
    const admin = await Admin.findOne({ where: { dairy_name } });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    // 🔹 Check for email existence if email is provided & different from the current one
    if (email && email !== admin.email) {
      const emailExists = await Promise.all([
        DeliveryBoy.findOne({ where: { email } }),
        SuperAdmin.findOne({ where: { email } }),
        Farmer.findOne({ where: { email } }),

        Admin.findOne({
          where: { email, dairy_name: { [Op.ne]: dairy_name } },
        }), // Exclude self
        User.findOne({ where: { email } }),
      ]);

      if (emailExists.some((user) => user !== null)) {
        return res
          .status(400)
          .json({ message: "Email already exists in another role." });
      }
    }

    // 🔹 Check for contact existence if contact is provided & different from the current one
    if (contact && contact !== admin.contact) {
      const contactExists = await Promise.all([
        DeliveryBoy.findOne({ where: { contact } }),
        SuperAdmin.findOne({ where: { contact } }),
        Farmer.findOne({ where: { contact } }),

        Admin.findOne({
          where: { contact, dairy_name: { [Op.ne]: dairy_name } },
        }), // Exclude self
        User.findOne({ where: { contact } }),
      ]);

      if (contactExists.some((user) => user !== null)) {
        return res
          .status(400)
          .json({ message: "Contact number already exists in another role." });
      }
    }

    // 🔹 Check for dairy name existence if new_dairy_name is provided & different from the current one
    if (new_dairy_name && new_dairy_name !== admin.dairy_name) {
      const dairyExists = await Admin.findOne({
        where: { dairy_name: new_dairy_name },
      });
      if (dairyExists) {
        return res.status(400).json({ message: "Dairy name already exists." });
      }
    }

    // Updating the profile fields only if they are provided
    if (email !== undefined) admin.email = email;
    if (contact !== undefined) admin.contact = contact;
    if (address !== undefined) admin.address = address;
    if (new_dairy_name !== undefined) admin.dairy_name = new_dairy_name;

    await admin.save();

    res.json({ message: "Profile updated successfully.", admin });
  } catch (error) {
    console.error("Error updating admin profile:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
module.exports.updateQuantity = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newQuantity } = req.body;
    const dairy_name = req.user.dairy_name; // Extracted from JWT token
    if (!newQuantity || newQuantity <= 0) {
      return res
        .status(400)
        .json({ message: "Invalid quantity. It must be greater than 0." });
    }

    // Find the Admin making the request
    const admin = await Admin.findOne({ where: { dairy_name } });

    if (!admin) {
      return res
        .status(403)
        .json({ message: "Unauthorized: Admin not found." });
    }

    // Find the User
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if the User belongs to the Admin's dairy
    if (user.dairy_name !== admin.dairy_name) {
      return res
        .status(403)
        .json({ message: "Unauthorized: You are not the owner of this user." });
    }

    // Update the quantity
    await user.update({ quantity: newQuantity });

    res.status(200).json({
      message: "Milk quantity updated successfully.",
      user: {
        id: user.id,
        name: user.name,
        dairy_name: user.dairy_name,
        new_quantity: user.quantity,
      },
    });
  } catch (error) {
    console.error("Error updating quantity:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
module.exports.getDeliveredMorningOrder = async (req, res) => {
  try {
    // 🔹 Extract user ID and role from JWT token
    const { dairy_name } = req.user;

    const admin = await Admin.findOne({ where: { dairy_name } });
    if (!admin) {
      return res
        .status(403)
        .json({ message: "Unauthorized: Admin not found." });
    }

    // 🔹 Find users who belong to this admin's dairy
    const users = await User.findAll({
      where: { dairy_name: admin.dairy_name },
      attributes: ["id"],
    });

    // 🔹 Extract user IDs under this admin
    const userIds = users.map((user) => user.id);

    // 🔹 Fetch delivered orders only for these users
    deliveredOrders = await DeliveryStatus.findAll({
      where: {
        userid: { [Op.in]: userIds },
        shift: "morning",
      },
      attributes: ["userid", "status", "date", "shift"],
    });

    // 🔹 Check if any orders exist
    if (!deliveredOrders || deliveredOrders.length === 0) {
      return res.status(404).json({ message: "No delivered orders found." });
    }

    return res.status(200).json({
      message: "Delivered orders fetched successfully.",
      orders: deliveredOrders,
    });
  } catch (error) {
    console.error("Error fetching delivered orders:", error.message);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports.getDeliveredEveningOrder = async (req, res) => {
  try {
    // 🔹 Extract user ID and role from JWT token
    const { dairy_name } = req.user;

    const admin = await Admin.findOne({ where: { dairy_name } });
    if (!admin) {
      return res
        .status(403)
        .json({ message: "Unauthorized: Admin not found." });
    }

    // 🔹 Find users who belong to this admin's dairy
    const users = await User.findAll({
      where: { dairy_name: admin.dairy_name },
      attributes: ["id"],
    });

    // 🔹 Extract user IDs under this admin
    const userIds = users.map((user) => user.id);

    // 🔹 Fetch delivered orders only for these users
    deliveredOrders = await DeliveryStatus.findAll({
      where: {
        userid: { [Op.in]: userIds },
        shift: "evening",
      },
      attributes: ["userid", "status", "date", "shift"],
    });

    // 🔹 Check if any orders exist
    if (!deliveredOrders || deliveredOrders.length === 0) {
      return res.status(404).json({ message: "No delivered orders found." });
    }

    return res.status(200).json({
      message: "Delivered orders fetched successfully.",
      orders: deliveredOrders,
    });
  } catch (error) {
    console.error("Error fetching delivered orders:", error.message);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports.updateReceivedPayment = async (req, res) => {
  try {
    const { userid } = req.params;
    const { received_payment } = req.body;

    if (!userid || !received_payment || received_payment <= 0) {
      return res.status(400).json({ message: "Invalid input data." });
    }

    // 🔹 Get the last month's date format
    let lastMonth = moment()
      .tz("Asia/Kolkata")
      .subtract(1, "months")
      .format("YYYY-MM");

    const paymentRecord = await PaymentDetails.findOne({
      where: { userid, month_year: lastMonth },
    });

    if (!paymentRecord) {
      return res
        .status(404)
        .json({ message: "Payment record for previous month not found." });
    }

    // 🔹 Calculate new pending payment
    let newPendingPayment = paymentRecord.pending_payment - received_payment;
    if (newPendingPayment < 0) newPendingPayment = 0;

    // 🔹 Update payments
    await paymentRecord.update({
      received_payment: paymentRecord.received_payment + received_payment,
      pending_payment: newPendingPayment,
    });

    // 🔹 Determine if we need to update start_date
    let newStartDate = null;

    if (newPendingPayment === 0) {
      // If pending payment is fully cleared, set start date to the 1st of the current month
      newStartDate = moment()
        .tz("Asia/Kolkata")
        .startOf("month")
        .format("YYYY-MM-DD");
    } else if (newPendingPayment < paymentRecord.payment) {
      // If pending payment is less than previous month's payment, check the existing start date
      let existingStartDate = moment(paymentRecord.start_date).tz(
        "Asia/Kolkata"
      );

      if (existingStartDate.format("YYYY-MM") === lastMonth) {
        // If existing start date is already in last month but **not** the 1st, keep it unchanged
        if (existingStartDate.date() !== 1) {
          newStartDate = paymentRecord.start_date; // Do not update start date
        } else {
          // Otherwise, update it to the first of last month
          newStartDate = moment()
            .tz("Asia/Kolkata")
            .subtract(1, "months")
            .startOf("month")
            .format("YYYY-MM-DD");
        }
      } else {
        // ✅ If start date is not in last month, update it to the first of last month
        newStartDate = moment()
          .tz("Asia/Kolkata")
          .subtract(1, "months")
          .startOf("month")
          .format("YYYY-MM-DD");
      }
    }

    // 🔹 Update start date if needed
    if (newStartDate) {
      await paymentRecord.update({ start_date: newStartDate });
    }

    return res.status(200).json({ message: "Payment updated successfully." });
  } catch (error) {
    console.error("Error updating payment:", error);
    return res
      .status(500)
      .json({ error: "Server error. Please try again later." });
  }
};
module.exports.updateadvancePayment = async (req, res) => {
  try {
    const { userid } = req.params;
    const { advance_payment, status } = req.body;

    if (!userid || !advance_payment || advance_payment <= 0) {
      return res.status(400).json({ message: "Invalid input data." });
    }

    const user = await User.findOne({ where: { id: userid } });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // If status is not 0, just add advance_payment to user's advance_payment
    if (status) {
      let newAdvancePayment = user.advance_payment + advance_payment;
      await user.update({ advance_payment: newAdvancePayment });

      return res
        .status(200)
        .json({ message: "Advance payment added successfully." });
    }

    // If status is 0, proceed with the full process
    if (user.advance_payment < advance_payment) {
      return res
        .status(400)
        .json({ message: "Insufficient advance payment balance." });
    }

    let lastMonth = moment()
      .tz("Asia/Kolkata")
      .subtract(1, "months")
      .format("YYYY-MM");

    const paymentRecord = await PaymentDetails.findOne({
      where: { userid, month_year: lastMonth },
    });

    if (!paymentRecord) {
      return res
        .status(404)
        .json({ message: "Payment record for previous month not found." });
    }

    if (paymentRecord.pending_payment <= advance_payment) {
      return res
        .status(400)
        .json({ message: "Advance payment cannot exceed pending payment." });
    }

    // Deduct advance payment from user table
    let newAdvancePayment = user.advance_payment - advance_payment;
    if (newAdvancePayment < 0) newAdvancePayment = 0;

    await user.update({ advance_payment: newAdvancePayment });
    // Update payments
    let newPendingPayment = paymentRecord.pending_payment - advance_payment;
    if (newPendingPayment < 0) newPendingPayment = 0;

    await paymentRecord.update({
      received_payment: paymentRecord.received_payment + advance_payment,
      advancePayment: user.advance_payment,
      pending_payment: newPendingPayment,
    });

    // console.log(paymentRecord);

    // If pending payment is 0, update the start date to the first of the current month
    if (newPendingPayment === 0) {
      let newStartDate = moment()
        .tz("Asia/Kolkata")
        .startOf("month")
        .format("YYYY-MM-DD");
      await User.update(
        { start_date: newStartDate },
        { where: { id: userid } }
      );
    }

    return res.status(200).json({ message: "Payment updated successfully." });
  } catch (error) {
    console.error("Error updating payment:", error);
    return res
      .status(500)
      .json({ error: "Server error. Please try again later." });
  }
};
module.exports.getAdminUsersLastMonthPayments = async (req, res) => {
  try {
    const { dairy_name } = req.user;

    if (!dairy_name) {
      return res
        .status(403)
        .json({ message: "Unauthorized: Admin dairy name missing." });
    }

    // 🔹 Get all users under this admin
    const users = await User.findAll({ where: { dairy_name } });
    if (!users.length) {
      return res
        .status(404)
        .json({ message: "No users found under this admin." });
    }

    const userIds = users.map((user) => user.id);

    // 🔹 Generate last 3 months in "YYYY-MM" format
    const last3Months = [
      moment().tz("Asia/Kolkata").subtract(1, "month").format("YYYY-MM"),
      moment().tz("Asia/Kolkata").subtract(2, "month").format("YYYY-MM"),
      moment().tz("Asia/Kolkata").subtract(3, "month").format("YYYY-MM"),
    ];

    // 🔹 Get payments for the latest month only (for status & display)
    const lastMonth = last3Months[0];
    const paymentRecords = await PaymentDetails.findAll({
      where: {
        userid: { [Op.in]: userIds },
        month_year: lastMonth,
      },
    });

    // 🔹 Get total received payment for last 3 months per user
    const totalReceivedPayments = await PaymentDetails.findAll({
      attributes: [
        "userid",
        [
          sequelize.fn("SUM", sequelize.col("received_payment")),
          "total_received_payment",
        ],
      ],
      where: {
        userid: { [Op.in]: userIds },
        month_year: { [Op.in]: last3Months },
      },
      group: ["userid"],
      raw: true,
    });

    const totalReceivedMap = {};
    totalReceivedPayments.forEach((record) => {
      totalReceivedMap[record.userid] = parseFloat(
        record.total_received_payment
      );
    });

    if (!paymentRecords.length) {
      return res.status(200).json({
        message: "No payments found for last month.",
        users: [],
        payments: [],
      });
    }

    // 🔹 Merge users with payment info and total received of last 3 months
    const usersWithStatus = paymentRecords.map((payment) => {
      const user = users.find((u) => u.id === payment.userid);
      
      // Convert qr_image Buffer to proper format for frontend
      let qr_image_data = null;
      if (user.qr_image && Buffer.isBuffer(user.qr_image)) {
        // Convert Buffer to base64 string for easier frontend handling
        qr_image_data = {
          type: 'Buffer',
          data: Array.from(user.qr_image)
        };
      }
      
      return {
        ...user.dataValues,
        qr_image: qr_image_data, // Replace with properly formatted data
        payment: payment.payment,
        pending_payment: payment.pending_payment,
        month_year: payment.month_year,
        start_date: payment.start_date,
        received_payment: totalReceivedMap[payment.userid] || 0, // 🔸 Total for 3 months
        status: payment.pending_payment === 0,
      };
    });

    return res.status(200).json({
      message: "Payment records fetched successfully.",
      users: usersWithStatus,
    });
  } catch (error) {
    console.error(
      "Error fetching last month's payment records:",
      error.message
    );
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
module.exports.getLastMonthTotalPayments = async (req, res) => {
  try {
    const { dairy_name } = req.user;

    const admin = await Admin.findOne({ where: { dairy_name } });
    if (!admin) {
      return res
        .status(403)
        .json({ message: "Unauthorized: Admin not found." });
    }

    // 🔹 Fetch all users
    const users = await User.findAll({
      where: { dairy_name },
      attributes: ["id", "name", "advance_payment"],
    });

    const userIds = users.map((user) => user.id);
    if (!userIds.length) {
      return res
        .status(404)
        .json({ message: "No users found under this dairy." });
    }

    // 🔹 Get current month (for pending) - changed from last month
    const currentMonth = moment()
      .tz("Asia/Kolkata")
      .format("YYYY-MM");

    const currentMonthRecords = await PaymentDetails.findAll({
      where: {
        userid: { [Op.in]: userIds },
        month_year: currentMonth,
      },
      attributes: ["pending_payment"],
    });

    // 🔹 Calculate total outstanding (from current month)
    let totalOutstandingPayment = currentMonthRecords.reduce(
      (sum, record) => sum + (Number(record.pending_payment) || 0),
      0
    );

    // 🔹 Calculate total received payment for last 3 months
    let totalReceivedPayment = 0;
    let monthWiseData = [];

    for (let i = 0; i < 3; i++) {
      let monthYear = moment()
        .tz("Asia/Kolkata")
        .subtract(i + 1, "months")
        .format("YYYY-MM");

      const monthlyRecords = await PaymentDetails.findAll({
        where: {
          userid: { [Op.in]: userIds },
          month_year: monthYear,
        },
        attributes: ["received_payment"],
      });

      let monthlyReceived = 0;
      for (const record of monthlyRecords) {
        monthlyReceived += Number(record.received_payment) || 0;
      }

      totalReceivedPayment += monthlyReceived;

      // Add breakdown
      monthWiseData.push({
        month: monthYear,
        received: monthlyReceived,
      });
    }

    // 🔹 Total Payment = Outstanding + Received
    const totalPayment = totalOutstandingPayment + totalReceivedPayment;

    // 🔹 Total Advance from user table
    const totalAdvancePayment = users.reduce(
      (sum, user) => sum + (user.advance_payment || 0),
      0
    );

    // ✅ Final Response
    return res.status(200).json({
      message:
        "Current month's outstanding and last 3 months received payment calculated.",
      totalOutstandingPayment,
      totalReceivedPayment,
      totalPayment,
      totalAdvancePayment,
      monthWiseBreakdown: monthWiseData,
    });
  } catch (error) {
    console.error("Error fetching payments:", error.message);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
module.exports.getLastMonthTotalMilk = async (req, res) => {
  try {
    // 🔹 Extract dairy_name from the authenticated admin
    const { dairy_name } = req.user; // Assuming req.user contains authenticated admin details

    // 🔹 Find the admin
    const admin = await Admin.findOne({ where: { dairy_name } });
    if (!admin) {
      return res
        .status(403)
        .json({ message: "Unauthorized: Admin not found." });
    }

    // 🔹 Get last month's date range
    let lastMonthYear = moment()
      .tz("Asia/Kolkata")
      .subtract(1, "months")
      .format("YYYY-MM");
    let lastMonthStart = moment()
      .tz("Asia/Kolkata")

      .startOf("month")
      .format("YYYY-MM-DD");
    let lastMonthEnd = moment()
      .tz("Asia/Kolkata")
      .endOf("month")
      .format("YYYY-MM-DD");
    //console.log

    // 🔹 Find all users under this admin's dairy
    const users = await User.findAll({
      where: { dairy_name },
      attributes: ["id"],
    });

    // Extract user IDs
    const userIds = users.map((user) => user.id);

    if (!userIds.length) {
      return res
        .status(404)
        .json({ message: "No users found under this dairy." });
    }

    // 🔹 Fetch delivery records for last month
    const deliveryRecords = await DeliveryStatus.findAll({
      where: {
        userid: { [Op.in]: userIds },
        date: { [Op.between]: [lastMonthStart, lastMonthEnd] },
      },
      attributes: ["quantity_array"],
    });

    if (!deliveryRecords.length) {
      return res
        .status(404)
        .json({ message: "No deliveries found for last month." });
    }

    // 🔹 Calculate total quantities
    let totalCowMilk = 0,
      totalBuffaloMilk = 0,
      totalPureMilk = 0;

    for (const record of deliveryRecords) {
      const quantities = Array.isArray(record.quantity_array)
        ? record.quantity_array
        : JSON.parse(record.quantity_array);

      const [cowQuantity, buffaloQuantity, pureQuantity] = quantities.map(
        (q) => Number(q) || 0
      );

      totalCowMilk += cowQuantity;
      totalBuffaloMilk += buffaloQuantity;
      totalPureMilk += pureQuantity;
    }

    return res.status(200).json({
      message: "Last month's milk quantities fetched successfully.",
      totalCowMilk,
      totalBuffaloMilk,
      totalPureMilk,
    });
  } catch (error) {
    console.error(
      "Error fetching last month's total milk quantities:",
      error.message
    );
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
module.exports.getAllMorningOrders = async (req, res) => {
  try {
    // Extract admin's dairy name from the authenticated request
    const { dairy_name } = req.user;

    if (!dairy_name) {
      return res
        .status(403)
        .json({ message: "Unauthorized: No dairy association found" });
    }

    // Get today's date in YYYY-MM-DD format
    const today = moment.tz("Asia/Kolkata").format("YYYY-MM-DD");

    // Fetch users with morning shift orders for today under this admin's dairy
    const morningOrders = await User.findAll({
      where: {
        dairy_name,
        request: true,
        // shift: "morning" || "both",
        shift: {
          [Op.or]: ["morning", "both"],
        },
        // start_date: { [Op.lte]: today },
      },
      attributes: { exclude: ["password_hash"] },
      order: [
        [sequelize.literal('CASE WHEN delivery_sequence_morning IS NULL THEN 999999 ELSE delivery_sequence_morning END'), 'ASC'],
        ['id', 'ASC'] // Fallback to ID if sequence is null
      ],
    });

    // If no orders found, return a message
    if (morningOrders.length === 0) {
      return res
        .status(404)
        .json({ message: "No morning orders found for today" });
    }

    res.json({
      message: "Today's morning shift orders fetched successfully",
      orders: morningOrders,
    });
  } catch (error) {
    console.error("Error fetching morning shift orders:", error);
    res.status(500).json({ message: "Server error" });
  }
};
module.exports.getAllEveningOrders = async (req, res) => {
  try {
    // Extract admin's dairy name from the authenticated request
    const { dairy_name } = req.user;

    if (!dairy_name) {
      return res
        .status(403)
        .json({ message: "Unauthorized: No dairy association found" });
    }

    // Get today's date in YYYY-MM-DD format
    const today = moment.tz("Asia/Kolkata").format("YYYY-MM-DD");
    // Fetch users with vacation_mode_morning = true under this admin's dairy
    const usersOnVacation = await User.findAll({
      where: {
        dairy_name,
        request: true,
        // shift: "evening" || "both",
        shift: {
          [Op.or]: ["evening", "both"],
        },
        // start_date: { [Op.lte]: today },
      },
      attributes: { exclude: ["password_hash"] },
      order: [
        [sequelize.literal('CASE WHEN delivery_sequence_evening IS NULL THEN 999999 ELSE delivery_sequence_evening END'), 'ASC'],
        ['id', 'ASC'] // Fallback to ID if sequence is null
      ],
    });

    res.json({
      message: "Users on vacation in the evening shift fetched successfully",
      users: usersOnVacation,
    });
  } catch (error) {
    console.error("Error fetching users on vacation:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports.getTodaysMorningOrder = async (req, res) => {
  try {
    const { dairy_name } = req.user;

    if (!dairy_name) {
      return res
        .status(403)
        .json({ message: "Unauthorized: No dairy association found" });
    }

    const today = moment.tz("Asia/Kolkata").format("YYYY-MM-DD");

    // 1️⃣ Regular users with morning/both shift (excluding vacation)
    const morningOrders = await User.findAll({
      where: {
        dairy_name,
        request: true,
        vacation_mode_morning: false,
        shift: {
          [Op.or]: ["morning", "both"],
        },
        start_date: { [Op.lte]: today },
      },
      attributes: { exclude: ["password_hash"] },
      order: [
        [sequelize.literal('CASE WHEN delivery_sequence_morning IS NULL THEN 999999 ELSE delivery_sequence_morning END'), 'ASC'],
        ['id', 'ASC'] // Fallback to ID if sequence is null
      ],
    });

    // 2️⃣ Additional morning orders placed today
    const additionalMorningOrders = await AdditionalOrder.findAll({
      where: {
        shift: "morning",
        date: today,
      },

      include: {
        model: User,
        as: "user", // 👈 MUST MATCH the alias used in .belongsTo
        attributes: ["id", "name", "dairy_name"],
        where: {
          dairy_name: dairy_name, // 🔐 Filter: Only users under this admin's dairy
        },
      },
    });

    // 3️⃣ Check if both are empty
    if (morningOrders.length === 0 && additionalMorningOrders.length === 0) {
      return res
        .status(404)
        .json({ message: "No morning orders found for today" });
    }

    // 4️⃣ Send combined result
    res.json({
      message: "Today's morning shift orders fetched successfully",
      regular_orders: morningOrders,
      additional_orders: additionalMorningOrders,
    });
  } catch (error) {
    console.error("Error fetching morning shift orders:", error);
    res.status(500).json({ message: "Server error" });
  }
};
module.exports.getTodaysEveningOrder = async (req, res) => {
  try {
    const { dairy_name } = req.user;

    if (!dairy_name) {
      return res
        .status(403)
        .json({ message: "Unauthorized: No dairy association found" });
    }

    const today = moment.tz("Asia/Kolkata").format("YYYY-MM-DD");

    // 1️⃣ Regular evening orders
    const eveningOrders = await User.findAll({
      where: {
        dairy_name,
        request: true,
        vacation_mode_evening: false,
        shift: {
          [Op.or]: ["evening", "both"],
        },
        start_date: { [Op.lte]: today },
      },
      attributes: { exclude: ["password_hash"] },
      order: [
        [sequelize.literal('CASE WHEN delivery_sequence_evening IS NULL THEN 999999 ELSE delivery_sequence_evening END'), 'ASC'],
        ['id', 'ASC'] // Fallback to ID if sequence is null
      ],
    });

    // 2️⃣ Additional evening orders for today
    const additionalEveningOrders = await AdditionalOrder.findAll({
      where: {
        shift: "evening",
        date: today,
      },
      include: {
        model: User,
        as: "user", // 👈 MUST MATCH the alias used in .belongsTo
        attributes: ["id", "name", "dairy_name"],
        where: {
          dairy_name: dairy_name,
        },
      },
    });

    // 3️⃣ If both are empty
    if (eveningOrders.length === 0 && additionalEveningOrders.length === 0) {
      return res
        .status(404)
        .json({ message: "No evening orders found for today" });
    }

    // 4️⃣ Send combined response
    res.json({
      message: "Today's evening shift orders fetched successfully",
      regular_orders: eveningOrders,
      additional_orders: additionalEveningOrders,
    });
  } catch (error) {
    console.error("Error fetching evening shift orders:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports.getTodaysAdditional = async (req, res) => {
  try {
    const { dairy_name } = req.user;

    if (!dairy_name) {
      return res.status(403).json({ message: "Unauthorized: No dairy association found" });
    }

    const today = moment.tz("Asia/Kolkata").format("YYYY-MM-DD");

    const additionalOrders = await AdditionalOrder.findAll({
      where: {
        date: {
          [Op.gte]: today,
        },
      },
      include: {
        model: User,
        as: "user",
        required: true, // INNER JOIN - only get orders with valid users
        attributes: [
          "id",
          "name",
          "dairy_name",
          "delivered_morning",
          "delivered_evening"
        ],
        where: {
          dairy_name: dairy_name,
        },
      },
      attributes: [
        "additinalOrder_id",
        "quantity_array",
        "shift",
        "date",
        "status"
      ],
    });

    const filteredOrders = additionalOrders
      .filter(order => order.user !== null) // Filter out orders with null users
      .map(order => {
        try {
          // Safely parse quantity_array
          let quantities = [0, 0, 0];
          try {
            if (Array.isArray(order.quantity_array)) {
              quantities = order.quantity_array;
            } else if (typeof order.quantity_array === 'string') {
              const parsed = JSON.parse(order.quantity_array);
              quantities = Array.isArray(parsed) ? parsed : [0, 0, 0];
            }
          } catch (parseError) {
            console.error("Error parsing quantity_array for order", order.additinalOrder_id, parseError);
            quantities = [0, 0, 0];
          }

      const [cowQuantity, buffaloQuantity, pureQuantity] = quantities.map(
        (q) => Number(q) || 0
      );

      return {
        id: order.additinalOrder_id,
        date: order.date,
        shift: order.shift,
        cowQuantity,
        buffaloQuantity,
        pureQuantity,
            delivered: order.status || false,
        user: {
              id: order.user?.id || null,
              name: order.user?.name || "Unknown",
              dairy_name: order.user?.dairy_name || null
        }
      };
        } catch (mapError) {
          console.error("Error processing order", order.additinalOrder_id, mapError);
          return null; // Return null for problematic orders
        }
      })
      .filter(order => order !== null); // Remove null entries

    // Return empty array instead of 404 - this is more appropriate for list endpoints
    res.json({
      message: filteredOrders.length > 0 
        ? "Today's additional orders fetched successfully" 
        : "No additional orders found",
      additional_orders: filteredOrders,
    });

  } catch (error) {
    console.error("Error fetching additional orders:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ 
      message: "Server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports.registerFarmer = async (req, res) => {
  try {
    const {
      full_name,
      email,
      contact,
      address,
      password_hash,
      milk_types, // Adding milk_types to the request body
    } = req.body;

    //  Validate milk_types to ensure it's an array
    if (!Array.isArray(milk_types) || milk_types.length === 0) {
      return res.status(400).json({
        message: "Milk types must be a non-empty array.",
      });
    }

    //  Extract dairy_name from authenticated admin
    const { dairy_name } = req.user;
    if (!dairy_name) {
      return res
        .status(403)
        .json({ message: "Unauthorized: No dairy association found." });
    }

    //  Check if email already exists in any role
    const emailExists = await Promise.all([
      Farmer.findOne({ where: { email } }),
      SuperAdmin.findOne({ where: { email } }),
      Admin.findOne({ where: { email } }),
      User.findOne({ where: { email } }),
      DeliveryBoy.findOne({ where: { email } }),
    ]);

    if (emailExists.some((user) => user !== null)) {
      return res.status(400).json({
        message: "Email already exists in another role.",
      });
    }

    //  Check if contact already exists in any role
    const contactExists = await Promise.all([
      Farmer.findOne({ where: { contact } }),
      SuperAdmin.findOne({ where: { contact } }),
      Admin.findOne({ where: { contact } }),
      User.findOne({ where: { contact } }),
      DeliveryBoy.findOne({ where: { contact } }),
    ]);

    if (contactExists.some((user) => user !== null)) {
      return res.status(400).json({
        message: "Mobile number already exists in another role.",
      });
    }

    //  Create new farmer with milk_types included
    const newFarmer = await Farmer.create({
      full_name,
      email,
      contact,
      address,
      password_hash,
      status: true, // Farmer is active by default
      dairy_name,
      milk_types, // Store milk types as an array
    });

    res.status(201).json({
      message: "Farmer registered successfully!",
      farmer: newFarmer,
    });
  } catch (error) {
    console.error("Error registering farmer:", error);
    res.status(500).json({ message: "Server error." });
  }
};

module.exports.getAllFarmers = async (req, res) => {
  try {
    // 🔹 Extract dairy_name from the authenticated admin
    const { dairy_name } = req.user;

    if (!dairy_name) {
      return res
        .status(403)
        .json({ message: "Unauthorized: No dairy association found." });
    }

    // 🔹 Fetch all farmers under the specific dairy
    const farmers = await Farmer.findAll({
      where: { dairy_name },
      attributes: { exclude: ["password_hash"] }, // Optional: hide sensitive data
      order: [["created_at", "DESC"]], // Optional: newest first
    });

    // 🔹 If no farmers found
    if (farmers.length === 0) {
      return res.status(404).json({
        message: "No farmers found under this dairy.",
      });
    }

    res.status(200).json({
      message: "Farmers fetched successfully.",
      farmers,
    });
  } catch (error) {
    console.error("Error fetching farmers:", error);
    res.status(500).json({ message: "Server error." });
  }
};

module.exports.addNewProduct = async (req, res) => {
  try {
    const { farmer_id } = req.params;
    const {
      cow_quantity,
      cow_fat,
      cow_rate,
      pure_quantity,
      pure_fat,
      pure_rate,
      buffalo_quantity,
      buffalo_fat,
      buffalo_rate,
    } = req.body;

    const { dairy_name } = req.user;

    // ✅ Find farmer and check if they belong to this admin's dairy
    const farmer = await Farmer.findByPk(farmer_id);

    if (!farmer) {
      return res.status(404).json({ message: "Farmer not found." });
    }

    if (farmer.dairy_name !== dairy_name) {
      return res
        .status(403)
        .json({
          message: "Unauthorized. Farmer does not belong to your dairy.",
        });
    }

    // ✅ Set default 0 for missing fields
    const newOrder = await DailyFarmerOrder.create({
      farmer_id,
      cow_quantity: cow_quantity ?? 0,
      cow_fat: cow_fat ?? 0,
      cow_rate: cow_rate ?? 0,
      pure_quantity: pure_quantity ?? 0,
      pure_fat: pure_fat ?? 0,
      pure_rate: pure_rate ?? 0,
      buffalo_quantity: buffalo_quantity ?? 0,
      buffalo_fat: buffalo_fat ?? 0,
      buffalo_rate: buffalo_rate ?? 0,
      date: new Date(),
    });

    res.status(201).json({
      message: "Daily order added successfully.",
      order: newOrder,
    });
  } catch (error) {
    console.error("Error adding daily order:", error);
    res.status(500).json({ message: "Server error." });
  }
};

module.exports.updateFarmerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { dairy_name } = req.user; // Extract admin's dairy name

    // Validate request input
    if (typeof status !== "boolean") {
      return res.status(400).json({
        message: "Invalid request value. Must be true or false.",
      });
    }

    const farmer = await Farmer.findByPk(id);
    if (!farmer) {
      return res.status(404).json({ message: "User not found" });
    }

    if (farmer.dairy_name !== dairy_name) {
      return res.status(403).json({
        message: "Unauthorized: You can only update users from your own dairy",
      });
    }

    // Update status
    farmer.status = status;
    await farmer.save(); // Save to DB

    res.json({
      message: "Request status updated successfully",
      farmer,
    });
  } catch (error) {
    console.error("Error updating request status:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports.getAllPendingFarmerPayments = async (req, res) => {
  try {
    const dairy_name = req.user.dairy_name;
    const moment = require("moment-timezone");

    if (!dairy_name) {
      return res.status(401).json({ message: "Unauthorized access." });
    }

    // Step 1: Fetch all farmers under this admin
    const farmers = await Farmer.findAll({
      where: { dairy_name: dairy_name },
      attributes: [
        "id",
        "full_name",
        "contact",
        "email",
        "dairy_name",
        "advance_payment",
      ],
    });

    // Return empty array if no farmers found (standard for list endpoints)
    if (!farmers.length) {
      return res.status(200).json({
        message: "No farmers found under this admin.",
        farmers: [],
      });
    }

    const farmerIds = farmers.map((f) => f.id);

    // Step 2: Get date range (last 10 days)
    const now = moment().tz("Asia/Kolkata");
    const startDate = now.clone().subtract(10, "days").startOf("day").toDate();
    const endDate = now.clone().endOf("day").toDate();

    // Step 3: Fetch all daily orders for these farmers
    const dailyOrders = await DailyFarmerOrder.findAll({
      where: {
        farmer_id: { [Op.in]: farmerIds },
        created_at: {
          [Op.between]: [startDate, endDate],
        },
      },
      raw: true,
    });

    // Step 4: Aggregate daily orders into weekly summaries by farmer
    const farmerWeekMap = {};

    for (const order of dailyOrders) {
      const farmerId = order.farmer_id;
      const orderDate = moment(order.created_at).tz("Asia/Kolkata");
      const week = orderDate.isoWeek();
      const year = orderDate.isoWeekYear();
      const weekKey = `${farmerId}-${year}-W${week}`;

      if (!farmerWeekMap[weekKey]) {
        farmerWeekMap[weekKey] = {
          farmer_id: farmerId,
          week_number: week,
          year: year,
          week_start_date: orderDate.clone().startOf("isoWeek").format("YYYY-MM-DD"),
          week_end_date: orderDate.clone().endOf("isoWeek").format("YYYY-MM-DD"),
          total_cow_quantity: 0,
          total_buffalo_quantity: 0,
          total_pure_quantity: 0,
          total_amount: 0,
        };
      }

      const cowQty = Number(order.cow_quantity) || 0;
      const cowRate = Number(order.cow_rate) || 0;
      const buffaloQty = Number(order.buffalo_quantity) || 0;
      const buffaloRate = Number(order.buffalo_rate) || 0;
      const pureQty = Number(order.pure_quantity) || 0;
      const pureRate = Number(order.pure_rate) || 0;

      const weekData = farmerWeekMap[weekKey];
      weekData.total_cow_quantity += cowQty;
      weekData.total_buffalo_quantity += buffaloQty;
      weekData.total_pure_quantity += pureQty;
      
      // NOTE: *_rate already stores total amount (fat * qty * base rate)
      weekData.total_amount += cowRate + buffaloRate + pureRate;
    }

    // Step 5: Get payment status from FarmerPayment table and UPDATE records
    const weeklySummaries = Object.values(farmerWeekMap);
    
    // Fetch existing payment records to get status
    const existingPayments = await FarmerPayment.findAll({
      where: {
        farmer_id: { [Op.in]: farmerIds },
      },
      raw: false, // Changed to false so we can update
    });

    // Create a map of payment records by week
    const paymentStatusMap = {};
    const paymentIdMap = {};
    const paymentPaidMap = {};
    const paymentPendingMap = {};
    const paymentRecordMap = {};
    existingPayments.forEach(payment => {
      const key = `${payment.farmer_id}-${payment.week_start_date}-${payment.week_end_date}`;
      paymentStatusMap[key] = payment.status;
      paymentIdMap[key] = payment.id;
      paymentPaidMap[key] = Number(payment.paid_amount) || 0;
      paymentPendingMap[key] = Number(payment.pending_amount) || 0;
      paymentRecordMap[key] = payment;
    });

    // Step 5.5: Update or create FarmerPayment records based on weekly summaries
    for (const week of weeklySummaries) {
      const statusKey = `${week.farmer_id}-${week.week_start_date}-${week.week_end_date}`;
      const existingPayment = paymentRecordMap[statusKey];

      if (existingPayment) {
        // Update existing payment record
        const paidAmount = Number(existingPayment.paid_amount) || 0;
        const pendingAmount = Math.max(week.total_amount - paidAmount, 0);
        const status = pendingAmount === 0;

        await existingPayment.update({
          total_cow_quantity: parseFloat(week.total_cow_quantity.toFixed(2)),
          total_buffalo_quantity: parseFloat(week.total_buffalo_quantity.toFixed(2)),
          total_pure_quantity: parseFloat(week.total_pure_quantity.toFixed(2)),
          total_amount: parseFloat(week.total_amount.toFixed(2)),
          pending_amount: parseFloat(pendingAmount.toFixed(2)),
          status: status,
        });

        // Update maps for later use
        paymentStatusMap[statusKey] = status;
        paymentPaidMap[statusKey] = paidAmount;
        paymentPendingMap[statusKey] = pendingAmount;
      } else {
        // Create new payment record
        const newPayment = await FarmerPayment.create({
          farmer_id: week.farmer_id,
          week_number: week.week_number,
          week_start_date: week.week_start_date,
          week_end_date: week.week_end_date,
          total_cow_quantity: parseFloat(week.total_cow_quantity.toFixed(2)),
          total_buffalo_quantity: parseFloat(week.total_buffalo_quantity.toFixed(2)),
          total_pure_quantity: parseFloat(week.total_pure_quantity.toFixed(2)),
          total_amount: parseFloat(week.total_amount.toFixed(2)),
          paid_amount: 0,
          pending_amount: parseFloat(week.total_amount.toFixed(2)),
          status: false,
        });

        // Update maps for later use
        paymentIdMap[statusKey] = newPayment.id;
        paymentStatusMap[statusKey] = false;
        paymentPaidMap[statusKey] = 0;
        paymentPendingMap[statusKey] = week.total_amount;
      }
    }

    // Step 6: Group weekly summaries by farmer and add payment status
    const groupedData = {};

    for (const week of weeklySummaries) {
      const farmerId = week.farmer_id;
      const statusKey = `${farmerId}-${week.week_start_date}-${week.week_end_date}`;
      const paymentStatus = paymentStatusMap[statusKey] ?? false;
      const paidAmount = paymentPaidMap[statusKey] ?? 0;
      const pendingAmount = paymentPendingMap[statusKey] ?? week.total_amount;

      if (!groupedData[farmerId]) {
        const farmerDetails = farmers.find((f) => f.id === farmerId);
        groupedData[farmerId] = {
          farmer_id: farmerDetails.id,
          full_name: farmerDetails.full_name,
          contact: farmerDetails.contact,
          email: farmerDetails.email,
          dairy_name: farmerDetails.dairy_name,
          advance_payment: farmerDetails.advance_payment,
          pending_payments: [],
        };
      }

      groupedData[farmerId].pending_payments.push({
        id: paymentIdMap[statusKey] || null, // Payment ID if exists, otherwise null
        week_number: week.week_number,
        week_start_date: week.week_start_date,
        week_end_date: week.week_end_date,
        total_cow_quantity: parseFloat(week.total_cow_quantity.toFixed(2)),
        total_buffalo_quantity: parseFloat(week.total_buffalo_quantity.toFixed(2)),
        total_pure_quantity: parseFloat(week.total_pure_quantity.toFixed(2)),
        total_amount: parseFloat(week.total_amount.toFixed(2)),
        status: paymentStatus,
        paid_amount: parseFloat(Number(paidAmount).toFixed(2)),
        pending_amount: parseFloat(Number(pendingAmount).toFixed(2)),
      });
    }

    // Sort payments by date (newest first) for each farmer
    Object.keys(groupedData).forEach(farmerId => {
      groupedData[farmerId].pending_payments.sort((a, b) => {
        return new Date(b.week_end_date) - new Date(a.week_end_date);
      });
    });

    // Return farmers array (empty if no payments)
    const farmersArray = Object.values(groupedData);
    
    return res.status(200).json({
      message: "Farmer payment history fetched successfully.",
      farmers: farmersArray.length > 0 ? farmersArray : [],
    });
  } catch (error) {
    console.error("Error fetching pending farmer payments:", error);
    return res.status(500).json({
      message: "Internal server error.",
      error: error.message,
    });
  }
};

module.exports.updateFarmerPaymentStatusById = async (req, res) => {
  try {
    const paymentId = req.params.id;
    const dairy_name = req.user.dairy_name;
    const { status, farmer_id, week_start_date, week_end_date, paid_amount } = req.body;

    let payment;

    // If paymentId is provided, use it (for backward compatibility)
    if (paymentId && paymentId !== "null" && paymentId !== "undefined") {
      payment = await FarmerPayment.findByPk(paymentId);
    } 
    // Otherwise, find or create payment based on week dates
    else if (farmer_id && week_start_date && week_end_date) {
      payment = await FarmerPayment.findOne({
        where: {
          farmer_id: farmer_id,
          week_start_date: week_start_date,
          week_end_date: week_end_date,
        },
      });

      // If payment doesn't exist, create it (aggregate from daily orders)
      if (!payment) {
        // Get farmer details
        const farmer = await Farmer.findByPk(farmer_id);
        if (!farmer || farmer.dairy_name !== dairy_name) {
          return res.status(403).json({ message: "Access denied. Not your farmer." });
        }

        // Aggregate daily orders for this week
        const startDate = new Date(week_start_date);
        const endDate = new Date(week_end_date);
        endDate.setHours(23, 59, 59, 999);

        const dailyOrders = await DailyFarmerOrder.findAll({
          where: {
            farmer_id: farmer_id,
            created_at: {
              [Op.between]: [startDate, endDate],
            },
          },
          raw: true,
        });

        let total_cow_quantity = 0;
        let total_buffalo_quantity = 0;
        let total_pure_quantity = 0;
        let total_amount = 0;

        for (const order of dailyOrders) {
          const cowQty = Number(order.cow_quantity) || 0;
          const cowRate = Number(order.cow_rate) || 0;
          const buffaloQty = Number(order.buffalo_quantity) || 0;
          const buffaloRate = Number(order.buffalo_rate) || 0;
          const pureQty = Number(order.pure_quantity) || 0;
          const pureRate = Number(order.pure_rate) || 0;

          total_cow_quantity += cowQty;
          total_buffalo_quantity += buffaloQty;
          total_pure_quantity += pureQty;
          // NOTE: *_rate already stores total amount (fat * qty * base rate), so just sum them
          total_amount += cowRate + buffaloRate + pureRate;
        }

        // Calculate week number
        const weekDate = moment(week_start_date).tz("Asia/Kolkata");
        const week_number = weekDate.isoWeek();

        // Create new payment record
        const normalizedPaid = paid_amount !== undefined && paid_amount !== null
          ? Math.max(0, Number(paid_amount) || 0)
          : 0;
        const normalizedPending = Math.max(total_amount - normalizedPaid, 0);
        const normalizedStatus = normalizedPending === 0;

        payment = await FarmerPayment.create({
          farmer_id: farmer_id,
          week_number: week_number,
          week_start_date: week_start_date,
          week_end_date: week_end_date,
          total_cow_quantity: parseFloat(total_cow_quantity.toFixed(2)),
          total_buffalo_quantity: parseFloat(total_buffalo_quantity.toFixed(2)),
          total_pure_quantity: parseFloat(total_pure_quantity.toFixed(2)),
          total_amount: parseFloat(total_amount.toFixed(2)),
          paid_amount: parseFloat(normalizedPaid.toFixed(2)),
          pending_amount: parseFloat(normalizedPending.toFixed(2)),
          status: normalizedStatus,
        });
      }
    } else {
      return res.status(400).json({ 
        message: "Either payment ID or (farmer_id, week_start_date, week_end_date) must be provided." 
      });
    }

    if (!payment) {
      return res.status(404).json({ message: "Farmer payment not found." });
    }

    // Verify farmer belongs to this admin's dairy
    const farmer = await Farmer.findByPk(payment.farmer_id);
    if (!farmer || farmer.dairy_name !== dairy_name) {
      return res.status(403).json({ message: "Access denied. Not your farmer." });
    }

    const totalAmount = Number(payment.total_amount) || 0;
    let nextPaidAmount;

    if (paid_amount !== undefined && paid_amount !== null) {
      // Add new payment to existing paid amount
      const currentPaid = Number(payment.paid_amount) || 0;
      const additionalPayment = Math.max(0, Number(paid_amount) || 0);
      nextPaidAmount = currentPaid + additionalPayment;
    } else if (status === true) {
      nextPaidAmount = totalAmount;
    } else if (status === false) {
      nextPaidAmount = 0;
    } else {
      nextPaidAmount = Number(payment.paid_amount) || 0;
    }

    if (nextPaidAmount > totalAmount) {
      nextPaidAmount = totalAmount;
    }

    const nextPendingAmount = Math.max(totalAmount - nextPaidAmount, 0);
    const nextStatus = nextPendingAmount === 0;

    // Update payment status and amounts
    payment.status = nextStatus;
    payment.paid_amount = parseFloat(nextPaidAmount.toFixed(2));
    payment.pending_amount = parseFloat(nextPendingAmount.toFixed(2));
    await payment.save(); // Triggers `beforeUpdate` hook to set `payment_date`

    // Update status of all related DailyFarmerOrder entries
    const startDate = new Date(payment.week_start_date);
    const endDate = new Date(payment.week_end_date);
    endDate.setHours(23, 59, 59, 999);

    const updatedOrders = await DailyFarmerOrder.update(
      { status: payment.status },
      {
        where: {
          farmer_id: payment.farmer_id,
          created_at: {
            [Op.between]: [startDate, endDate],
          },
        },
      }
    );

    return res.status(200).json({
      message: "Payment status and related orders updated successfully.",
      payment_id: payment.id,
      updated_orders_count: updatedOrders[0],
    });
  } catch (error) {
    console.error("Error updating payment status:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports.updateFarmeradvancePayment = async (req, res) => {
  try {
    const { farmer_id } = req.params;
    const { advance_payment, status } = req.body;
    const dairy_name = req.user?.dairy_name;

    // Validate input
    if (!farmer_id || isNaN(advance_payment) || Number(advance_payment) <= 0) {
      return res.status(400).json({ message: "Invalid input data." });
    }

    const farmer = await Farmer.findOne({ where: { id: farmer_id } });
    if (!farmer) {
      return res.status(404).json({ message: "Farmer not found." });
    }

    if (farmer.dairy_name !== dairy_name) {
      return res
        .status(403)
        .json({ message: "Access denied. Not your farmer." });
    }

    const paymentAmount = Number(advance_payment);
    const todayDate = new Date();

    // If status is truthy (1 or true), add advance payment
    if (status) {
      const newAdvancePayment = farmer.advance_payment + paymentAmount;

      await farmer.update({
        advance_payment: newAdvancePayment,
        advance_payment_date: todayDate,
      });

      return res.status(200).json({
        message: "Advance payment added successfully.",
        updated_balance: newAdvancePayment,
      });
    }

    // If status is 0 or falsy, deduct advance payment
    if (farmer.advance_payment < paymentAmount) {
      return res
        .status(400)
        .json({ message: "Insufficient advance payment balance." });
    }

    const newAdvancePayment = farmer.advance_payment - paymentAmount;

    await farmer.update({
      advance_payment: newAdvancePayment,
      advance_payment_date: todayDate,
    });

    return res.status(200).json({
      message: "Advance payment deducted successfully.",
      updated_balance: newAdvancePayment,
    });
  } catch (error) {
    console.error("Error updating advance payment:", error);
    return res
      .status(500)
      .json({ error: "Server error. Please try again later." });
  }
};

module.exports.getallDailyOrderHistory = async (req, res) => {
  const dairy_name = req.user.dairy_name;

  if (!dairy_name) {
    return res.status(401).json({ message: "Unauthorized access." });
  }

  const startDate = moment().subtract(1, "month").startOf("day").toDate();
  const endDate = moment().endOf("day").toDate();

  try {
    // Step 1: Get all farmers under the dairy
    const farmers = await Farmer.findAll({
      where: { dairy_name },
      attributes: [
        "id",
        "full_name",
        "contact",
        "email",
        "dairy_name",
        "advance_payment",
      ],
      raw: true,
    });

    if (!farmers.length) {
      return res
        .status(404)
        .json({ message: "No farmers found under this dairy." });
    }

    const farmerMap = {};
    const farmerIds = farmers.map((farmer) => {
      farmerMap[farmer.id] = farmer;
      return farmer.id;
    });

    // Step 2: Fetch orders for these farmers in date range
    const orders = await DailyFarmerOrder.findAll({
      where: {
        farmer_id: { [Op.in]: farmerIds },
        created_at: {
          [Op.between]: [startDate, endDate],
        },
      },
      raw: true,
    });

    // Step 3: Attach farmer details to each order
    const formattedOrders = orders.map((order) => {
      return {
        ...order,
        created_at: moment(order.created_at).format("YYYY-MM-DD"),
        farmer: farmerMap[order.farmer_id] || {},
      };
    });

    res.status(200).json({
      data: formattedOrders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
};

module.exports.AdminName = async (req, res) => {
  try {
    if (!req.user || !req.user.dairy_name) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated or dairy_name not found",
      });
    }

    const { dairy_name } = req.user;
    res.status(200).json({
      message: "Admin name successfully fetched",
      dairy_name: dairy_name,
    });
  } catch (error) {
    console.error("Error fetching Admin Name:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to fetch Admin Name",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports.getDeliveredAdditionalOrder = async (req, res) => {
  try {
    const { dairy_name } = req.user;

    // 🔹 Find admin
    const admin = await Admin.findOne({ where: { dairy_name } });
    if (!admin) {
      return res.status(403).json({ message: "Unauthorized: Admin not found." });
    }

    // 🔹 Get all users under this admin's dairy
    const users = await User.findAll({
      where: { dairy_name: admin.dairy_name },
      attributes: ["id"],
    });

    const userIds = users.map((user) => user.id);

    // 🔹 Join AdditinalOrder with DeliveryStatus
    // Use LEFT JOIN (required: false) to get all orders, even without delivery status
    const orders = await AdditionalOrder.findAll({
      where: {
        userid: { [Op.in]: userIds },
      },
      include: [
        {
          model: DeliveryStatus,
          as: "DeliveryStatus", // ✅ MUST match alias in model association
          required: false, // LEFT JOIN - include orders even without delivery status
          attributes: ["status", "date", "shift"],
        },
      ],
      attributes: ["additinalOrder_id", "userid", "date", "shift"],
    });

    // Format orders - handle cases where DeliveryStatus might be null or empty
    const formatted = orders.map((order) => {
      let deliveryStatusArray = [];
      
      // Handle DeliveryStatus - it could be an array or null
      if (order.DeliveryStatus) {
        if (Array.isArray(order.DeliveryStatus)) {
          deliveryStatusArray = order.DeliveryStatus.map((ds) => ({
            status: ds.status,
            date: ds.date,
            shift: ds.shift,
          }));
        } else {
          // Single object
          deliveryStatusArray = [{
            status: order.DeliveryStatus.status,
            date: order.DeliveryStatus.date,
            shift: order.DeliveryStatus.shift,
          }];
        }
      }

      return {
      additinalOrder_id: order.additinalOrder_id,
      userid: order.userid,
      date: order.date,
      shift: order.shift,
        deliveryStatus: deliveryStatusArray,
      };
    });

    return res.status(200).json({
      message: "Delivered additional orders fetched successfully.",
      orders: formatted,
    });
  } catch (error) {
    console.error("Error fetching delivered additional orders:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ 
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports.updateFCMToken = async (req, res) => {
  try {
    const { fcm_token } = req.body; // New FCM token from the client
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "User not authenticated." });
    }

    const userId = req.user.id; // Assuming the user is already authenticated and req.user.id holds the user's ID

    if (!fcm_token) {
      return res.status(400).json({ message: "FCM token is required." });
    }

    // Find the user in the respective model based on their role
    const user = await Admin.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Update the FCM token
    await user.update({ fcm_token });

    return res.status(200).json({ message: "FCM token updated successfully." });
  } catch (error) {
    console.error("Error updating FCM token:", error.message);
    console.error("Error stack:", error.stack);
    return res.status(500).json({ 
      message: "Server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update Customer Notification (Admin)
module.exports.updateCustomerNotification = async (req, res) => {
  try {
    const { customer_notification, customer_notification_active } = req.body;
    const { dairy_name } = req.user; // Get admin's dairy name from token

    // Validate input
    if (customer_notification_active !== undefined && typeof customer_notification_active !== 'boolean') {
      return res.status(400).json({ 
        message: "customer_notification_active must be a boolean (true or false)." 
      });
    }

    // Find the admin
    const admin = await Admin.findOne({ where: { dairy_name } });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    // Prepare update object
    const updateData = {};
    if (customer_notification !== undefined) {
      updateData.customer_notification = customer_notification || null;
    }
    if (customer_notification_active !== undefined) {
      updateData.customer_notification_active = customer_notification_active;
    }
    if (customer_notification !== undefined || customer_notification_active !== undefined) {
      updateData.customer_notification_updated_at = new Date();
    }

    // Update admin
    await admin.update(updateData);

    res.status(200).json({
      message: "Customer notification updated successfully.",
      notification: {
        message: admin.customer_notification,
        active: admin.customer_notification_active,
        updated_at: admin.customer_notification_updated_at
      }
    });
  } catch (error) {
    console.error("Error updating customer notification:", error);
    res.status(500).json({ 
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get Customer Notification (Admin - to view current notification)
module.exports.getCustomerNotification = async (req, res) => {
  try {
    const { dairy_name } = req.user; // Get admin's dairy name from token

    const admin = await Admin.findOne({ 
      where: { dairy_name },
      attributes: ['customer_notification', 'customer_notification_active', 'customer_notification_updated_at']
    });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    res.status(200).json({
      notification: {
        message: admin.customer_notification || "",
        active: admin.customer_notification_active || false,
        updated_at: admin.customer_notification_updated_at || null
      }
    });
  } catch (error) {
    console.error("Error fetching customer notification:", error);
    res.status(500).json({ 
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports.add_Farmer_Rate = async (req, res) => {
  try {
    const { farmer_cow_rate, farmer_buffalo_rate, farmer_pure_rate } = req.body;

    // Extract dairy_name from JWT token
    const { dairy_name } = req.user;

    // Check if the Admin exists
    const admin = await Admin.findOne({ where: { dairy_name } });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Helper function to parse and validate numeric values
    const parseRate = (value, fieldName) => {
      if (value === undefined || value === null || value === "") {
        return null;
      }
      // Convert to number (handles both string and number inputs)
      const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
      
      // Check if it's a valid number
      if (isNaN(numValue) || !isFinite(numValue)) {
        throw new Error(`${fieldName} must be a valid number.`);
      }
      
      // Check if it's non-negative
      if (numValue < 0) {
        throw new Error(`${fieldName} must be a non-negative number.`);
      }
      
      // Round to 2 decimal places to match DECIMAL(10,2) if that's what the DB uses
      return Math.round(numValue * 100) / 100;
    };

    // Create an object with only valid non-negative numbers to update
    const updateFields = {};
    
    if (farmer_cow_rate !== undefined && farmer_cow_rate !== null && farmer_cow_rate !== "") {
      try {
        updateFields.farmer_cow_rate = parseRate(farmer_cow_rate, "Farmer cow rate");
      } catch (error) {
        return res.status(400).json({ message: error.message });
      }
    }
    
    if (farmer_buffalo_rate !== undefined && farmer_buffalo_rate !== null && farmer_buffalo_rate !== "") {
      try {
        updateFields.farmer_buffalo_rate = parseRate(farmer_buffalo_rate, "Farmer buffalo rate");
      } catch (error) {
        return res.status(400).json({ message: error.message });
      }
    }
    
    if (farmer_pure_rate !== undefined && farmer_pure_rate !== null && farmer_pure_rate !== "") {
      try {
        updateFields.farmer_pure_rate = parseRate(farmer_pure_rate, "Farmer pure rate");
      } catch (error) {
        return res.status(400).json({ message: error.message });
      }
    }

    // If no valid updates are provided, return an error
    if (Object.keys(updateFields).length === 0) {
      return res
        .status(400)
        .json({ message: "No valid rate provided for update." });
    }

    // Log the values being updated for debugging
    console.log("Updating farmer rates:", updateFields);

    // Update only the provided fields
    await admin.update(updateFields);

    return res.status(200).json({
      message: "Rates updated successfully",
      updatedRates: updateFields,
    });
  } catch (error) {
    console.error("Error updating rates:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports.getAllRate = async (req, res) => {
  try {
    // 🔹 Extract user ID from JWT token
    const { dairy_name } = req.user;
    // console.log(dairy_name);
    // 🔹 Fetch the corresponding dairy admin's rates
    const admin = await Admin.findOne({
      where: { dairy_name },
      attributes: ["farmer_cow_rate", "farmer_buffalo_rate", "farmer_pure_rate"], // Fetch only rate-related fields
    });

    if (!admin) {
      return res
        .status(404)
        .json({ message: "Admin not found for this dairy." });
    }

    return res.status(200).json({
      message: "Rate fetched successfully.",
      // delivery_charges: admin.delivery_charges,
      farmer_cow_rate: admin.farmer_cow_rate,
      farmer_buffalo_rate: admin.farmer_buffalo_rate,
      farmer_pure_rate: admin.farmer_pure_rate,
    });
  } catch (error) {
    console.error("Error fetching milk rate:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports.updateDeliveryStatus = async (req, res) => {
  const { id } = req.params; // User ID
  const { status, shift = "morning" } = req.body; // Boolean + shift
  const { dairy_name } = req.user; // Extracted from JWT

  try {
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.dairy_name !== dairy_name) {
      return res.status(403).json({
        message: "Unauthorized: You can only update users from your own dairy",
      });
    }

    if (!["morning", "evening"].includes(shift)) {
      return res.status(400).json({ message: "Invalid shift. Use 'morning' or 'evening'." });
    }

    const today = moment.tz("Asia/Kolkata").format("YYYY-MM-DD");

    let order = await DeliveryStatus.findOne({
      where: {
        userid: id,
        date: today,
        shift,
      },
    });

    // Build quantity_array for manual toggle
    let quantityArray = [0, 0, 0]; // [pure, cow, buffalo]
    if (status === true) {
      if (user.milk_type === "buffalo") {
        quantityArray = [0, 0, Number(user.quantity) || 0];
      } else if (user.milk_type === "cow") {
        quantityArray = [0, Number(user.quantity) || 0, 0];
      } else if (user.milk_type === "pure") {
        quantityArray = [Number(user.quantity) || 0, 0, 0];
      }
    }

    if (!order) {
      // Create record if missing (pending state)
      order = await DeliveryStatus.create({
        userid: id,
        quantity_array: JSON.stringify(quantityArray),
        shift,
        status,
        date: today,
      });
    } else {
      // Update record if exists
      order.status = status;
      order.quantity_array = JSON.stringify(quantityArray);
      await order.save();
    }

    // Update user's delivered flag for the shift
    const updateField =
      shift === "morning"
        ? { delivered_morning: status }
        : { delivered_evening: status };
    await User.update(updateField, { where: { id } });

    // If additional order exists for today and shift, update its status
    const additionalOrder = await AdditionalOrder.findOne({
      where: {
        userid: id,
        date: today,
        shift,
      },
    });

    if (additionalOrder) {
      await AdditionalOrder.update(
        { status },
        { where: { additinalOrder_id: additionalOrder.additinalOrder_id } }
      );
    }

    res.status(200).json({
      message: "Delivery status updated successfully",
      order: {
        id: order.id,
        status: order.status,
        date: order.date,
        shift: order.shift,
      },
    });

  } catch (error) {
    console.error("Error updating delivery status:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Update delivery sequence for customers
module.exports.updateDeliverySequence = async (req, res) => {
  try {
    const { dairy_name } = req.user;
    const { customerIds, shift } = req.body; // customerIds is an array of user IDs in the desired order

    if (!dairy_name) {
      return res.status(403).json({ message: "Unauthorized: No dairy association found" });
    }

    if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
      return res.status(400).json({ message: "customerIds must be a non-empty array" });
    }

    if (!shift || !["morning", "evening"].includes(shift)) {
      return res.status(400).json({ message: "shift must be 'morning' or 'evening'" });
    }

    const sequenceField = shift === "morning" ? "delivery_sequence_morning" : "delivery_sequence_evening";

    // Verify all customers belong to the admin's dairy
    const customers = await User.findAll({
      where: {
        id: customerIds,
        dairy_name: dairy_name,
      },
    });

    if (customers.length !== customerIds.length) {
      return res.status(403).json({ 
        message: "Some customers do not belong to your dairy or do not exist" 
      });
    }

    // Update sequence for each customer
    const updatePromises = customerIds.map((customerId, index) => {
      return User.update(
        { [sequenceField]: index + 1 },
        { where: { id: customerId } }
      );
    });

    await Promise.all(updatePromises);

    res.status(200).json({
      message: `Delivery sequence updated successfully for ${shift} shift`,
      updatedCount: customerIds.length,
    });
  } catch (error) {
    console.error("Error updating delivery sequence:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get milk distribution for all delivery boys (today and yesterday)
module.exports.getMilkDistribution = async (req, res) => {
  try {
    const admin = req.user;
    const dairyName = admin.dairy_name;

    // Get today and yesterday dates
    const today = moment().tz("Asia/Kolkata").format("YYYY-MM-DD");
    const yesterday = moment().tz("Asia/Kolkata").subtract(1, "days").format("YYYY-MM-DD");

    // Get all delivery boys for this dairy
    const deliveryBoys = await DeliveryBoy.findAll({
      where: { dairy_name: dairyName },
      attributes: ["id", "name", "email", "contact"],
    });

    // Get milk distribution for today and yesterday for all delivery boys (morning and evening)
    const distributionData = await Promise.all(
      deliveryBoys.map(async (db) => {
        // Today's distribution - morning and evening
        const todayMorning = await DeliveryBoyMilkDistribution.findOne({
          where: {
            delivery_boy_id: db.id,
            date: today,
            shift: "morning",
          },
        });

        const todayEvening = await DeliveryBoyMilkDistribution.findOne({
          where: {
            delivery_boy_id: db.id,
            date: today,
            shift: "evening",
          },
        });

        // Yesterday's distribution - morning and evening
        const yesterdayMorning = await DeliveryBoyMilkDistribution.findOne({
          where: {
            delivery_boy_id: db.id,
            date: yesterday,
            shift: "morning",
          },
        });

        const yesterdayEvening = await DeliveryBoyMilkDistribution.findOne({
          where: {
            delivery_boy_id: db.id,
            date: yesterday,
            shift: "evening",
          },
        });

        // Calculate totals for yesterday
        const yesterdayTotalPure = (parseFloat(yesterdayMorning?.pure_quantity || 0) + parseFloat(yesterdayEvening?.pure_quantity || 0));
        const yesterdayTotalCow = (parseFloat(yesterdayMorning?.cow_quantity || 0) + parseFloat(yesterdayEvening?.cow_quantity || 0));
        const yesterdayTotalBuffalo = (parseFloat(yesterdayMorning?.buffalo_quantity || 0) + parseFloat(yesterdayEvening?.buffalo_quantity || 0));

        return {
          delivery_boy_id: db.id,
          delivery_boy_name: db.name,
          delivery_boy_email: db.email,
          delivery_boy_contact: db.contact,
          today: {
            morning: {
              pure_quantity: todayMorning?.pure_quantity || 0,
              cow_quantity: todayMorning?.cow_quantity || 0,
              buffalo_quantity: todayMorning?.buffalo_quantity || 0,
            },
            evening: {
              pure_quantity: todayEvening?.pure_quantity || 0,
              cow_quantity: todayEvening?.cow_quantity || 0,
              buffalo_quantity: todayEvening?.buffalo_quantity || 0,
            },
          },
          yesterday: {
            morning: {
              pure_quantity: yesterdayMorning?.pure_quantity || 0,
              cow_quantity: yesterdayMorning?.cow_quantity || 0,
              buffalo_quantity: yesterdayMorning?.buffalo_quantity || 0,
            },
            evening: {
              pure_quantity: yesterdayEvening?.pure_quantity || 0,
              cow_quantity: yesterdayEvening?.cow_quantity || 0,
              buffalo_quantity: yesterdayEvening?.buffalo_quantity || 0,
            },
            total: {
              pure_quantity: yesterdayTotalPure,
              cow_quantity: yesterdayTotalCow,
              buffalo_quantity: yesterdayTotalBuffalo,
            },
          },
        };
      })
    );

    res.status(200).json({
      success: true,
      data: distributionData,
      today_date: today,
      yesterday_date: yesterday,
    });
  } catch (error) {
    console.error("Error fetching milk distribution:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update milk distribution for a delivery boy for today
module.exports.updateMilkDistribution = async (req, res) => {
  try {
    const admin = req.user;
    const dairyName = admin.dairy_name;
    const { delivery_boy_id, shift, pure_quantity, cow_quantity, buffalo_quantity } = req.body;

    // Validate input
    if (!delivery_boy_id) {
      return res.status(400).json({ message: "Delivery boy ID is required" });
    }

    if (!shift || !["morning", "evening"].includes(shift)) {
      return res.status(400).json({ message: "Shift is required and must be 'morning' or 'evening'" });
    }

    // Verify delivery boy belongs to this dairy
    const deliveryBoy = await DeliveryBoy.findOne({
      where: {
        id: delivery_boy_id,
        dairy_name: dairyName,
      },
    });

    if (!deliveryBoy) {
      return res.status(404).json({ message: "Delivery boy not found or doesn't belong to your dairy" });
    }

    // Get today's date
    const today = moment().tz("Asia/Kolkata").format("YYYY-MM-DD");

    // Convert to numbers
    const pureQty = parseFloat(pure_quantity) || 0;
    const cowQty = parseFloat(cow_quantity) || 0;
    const buffaloQty = parseFloat(buffalo_quantity) || 0;

    // Find or create today's distribution record for the specific shift
    const [distribution, created] = await DeliveryBoyMilkDistribution.findOrCreate({
      where: {
        delivery_boy_id: delivery_boy_id,
        date: today,
        shift: shift,
      },
      defaults: {
        delivery_boy_id: delivery_boy_id,
        date: today,
        shift: shift,
        pure_quantity: pureQty,
        cow_quantity: cowQty,
        buffalo_quantity: buffaloQty,
      },
    });

    // If record exists, update it
    if (!created) {
      await distribution.update({
        pure_quantity: pureQty,
        cow_quantity: cowQty,
        buffalo_quantity: buffaloQty,
        updated_at: new Date(),
      });
    }

    res.status(200).json({
      success: true,
      message: `Milk distribution updated successfully for ${shift} shift`,
      data: {
        delivery_boy_id: delivery_boy_id,
        delivery_boy_name: deliveryBoy.name,
        date: today,
        pure_quantity: pureQty,
        cow_quantity: cowQty,
        buffalo_quantity: buffaloQty,
      },
    });
  } catch (error) {
    console.error("Error updating milk distribution:", error);
    
    // Check for specific database errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ 
        message: "A record already exists for this delivery boy, date, and shift combination",
        error: error.message 
      });
    }
    
    if (error.name === 'SequelizeDatabaseError') {
      return res.status(500).json({ 
        message: "Database error. Please ensure the 'shift' column and unique index exist in the database.",
        error: error.message,
        hint: "Run the SQL migration: ADD_MISSING_UNIQUE_INDEX.sql"
      });
    }
    
    res.status(500).json({ 
      message: "Server error", 
      error: error.message,
      details: error.stack 
    });
  }
};

// Get daily report metrics (now supports monthly totals)
module.exports.getDailyReport = async (req, res) => {
  try {
    const admin = req.user;
    const dairyName = admin.dairy_name;
    const { year, month } = req.query;

    // If month and year are provided, calculate monthly totals, otherwise use today
    let startDate, endDate, dateLabel;
    if (year && month) {
      startDate = moment(`${year}-${month}-01`).tz("Asia/Kolkata").startOf("month").format("YYYY-MM-DD");
      endDate = moment(`${year}-${month}-01`).tz("Asia/Kolkata").endOf("month").format("YYYY-MM-DD");
      dateLabel = moment(`${year}-${month}-01`).format("YYYY-MM");
    } else {
      const today = moment().tz("Asia/Kolkata").format("YYYY-MM-DD");
      startDate = today;
      endDate = today;
      dateLabel = today;
    }

    // 1. Overall Total Milk (from DailyFarmerOrder for the period)
    const startDateTime = moment(startDate).tz("Asia/Kolkata").startOf("day").toDate();
    const endDateTime = moment(endDate).tz("Asia/Kolkata").endOf("day").toDate();

    const farmerOrders = await DailyFarmerOrder.findAll({
      where: {
        created_at: {
          [Op.between]: [startDateTime, endDateTime],
        },
      },
      include: [
        {
          model: Farmer,
          as: "farmer",
          attributes: ["dairy_name"],
          where: { dairy_name: dairyName },
        },
      ],
    });

    let overallTotalMilk = 0;
    farmerOrders.forEach((order) => {
      overallTotalMilk +=
        parseFloat(order.pure_quantity || 0) +
        parseFloat(order.cow_quantity || 0) +
        parseFloat(order.buffalo_quantity || 0);
    });

    // 2. Total Milk Given to Delivery Boys (from DeliveryBoyMilkDistribution for the period)
    const deliveryBoys = await DeliveryBoy.findAll({
      where: { dairy_name: dairyName },
      attributes: ["id"],
    });

    const deliveryBoyIds = deliveryBoys.map((db) => db.id);

    const milkDistributions = await DeliveryBoyMilkDistribution.findAll({
      where: {
        date: {
          [Op.between]: [startDate, endDate],
        },
        delivery_boy_id: {
          [Op.in]: deliveryBoyIds,
        },
      },
    });

    let totalMilkGivenToDeliveryBoy = 0;
    milkDistributions.forEach((dist) => {
      totalMilkGivenToDeliveryBoy +=
        parseFloat(dist.pure_quantity || 0) +
        parseFloat(dist.cow_quantity || 0) +
        parseFloat(dist.buffalo_quantity || 0);
    });

    // 3. Total Milk Delivered to Customers (from DeliveryStatus for the period)
    const users = await User.findAll({
      where: { dairy_name: dairyName },
      attributes: ["id"],
    });

    const userIds = users.map((u) => u.id);

    const deliveryStatuses = await DeliveryStatus.findAll({
      where: {
        date: {
          [Op.between]: [startDate, endDate],
        },
        userid: {
          [Op.in]: userIds,
        },
      },
    });

    let totalMilkDelivered = 0;
    deliveryStatuses.forEach((status) => {
      let quantities;
      if (typeof status.quantity_array === "string") {
        quantities = JSON.parse(status.quantity_array);
      } else if (Array.isArray(status.quantity_array)) {
        quantities = status.quantity_array;
      } else {
        quantities = [0, 0, 0];
      }

      // quantity_array format: [pure, cow, buffalo]
      const pure = parseFloat(quantities[0] || 0);
      const cow = parseFloat(quantities[1] || 0);
      const buffalo = parseFloat(quantities[2] || 0);

      totalMilkDelivered += pure + cow + buffalo;
    });

    // 4. Remaining Milk (Given to Delivery Boy - Delivered to Customers)
    const remainingMilk = totalMilkGivenToDeliveryBoy - totalMilkDelivered;

    res.status(200).json({
      success: true,
      date: dateLabel,
      period: year && month ? `${moment(`${year}-${month}-01`).format("MMMM YYYY")}` : "Today",
      data: {
        overall_total_milk: parseFloat(overallTotalMilk.toFixed(2)),
        total_milk_given_to_delivery_boy: parseFloat(
          totalMilkGivenToDeliveryBoy.toFixed(2)
        ),
        total_milk_delivered: parseFloat(totalMilkDelivered.toFixed(2)),
        remaining_milk: parseFloat(remainingMilk.toFixed(2)),
      },
    });
  } catch (error) {
    console.error("Error fetching daily report:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get delivery boy monthly report
module.exports.getDeliveryBoyMonthlyReport = async (req, res) => {
  try {
    const admin = req.user;
    const dairyName = admin.dairy_name;
    const { delivery_boy_id, year, month } = req.query;

    // Validate input
    if (!delivery_boy_id) {
      return res.status(400).json({ message: "Delivery boy ID is required" });
    }

    if (!year || !month) {
      return res.status(400).json({ message: "Year and month are required" });
    }

    // Verify delivery boy belongs to this dairy
    const deliveryBoy = await DeliveryBoy.findOne({
      where: {
        id: parseInt(delivery_boy_id),
        dairy_name: dairyName,
      },
      attributes: ["id", "name", "email"],
    });

    if (!deliveryBoy) {
      return res.status(404).json({ message: "Delivery boy not found or doesn't belong to your dairy" });
    }

    // Calculate date range for the month
    const startDate = moment(`${year}-${month}-01`).tz("Asia/Kolkata").startOf("month").format("YYYY-MM-DD");
    const endDate = moment(`${year}-${month}-01`).tz("Asia/Kolkata").endOf("month").format("YYYY-MM-DD");

    // Get milk given to delivery boy for the month (from DeliveryBoyMilkDistribution)
    const milkGivenRecords = await DeliveryBoyMilkDistribution.findAll({
      where: {
        delivery_boy_id: parseInt(delivery_boy_id),
        date: {
          [Op.between]: [startDate, endDate],
        },
      },
      order: [["date", "ASC"], ["shift", "ASC"]],
    });

    // Get milk delivered by delivery boy for the month (from DeliveryStatus)
    // Get all users for this dairy (all users in the dairy are served by delivery boys from the same dairy)
    const users = await User.findAll({
      where: {
        dairy_name: dairyName,
      },
      attributes: ["id"],
    });

    const userIds = users.map((u) => u.id);

    const milkDeliveredRecords = await DeliveryStatus.findAll({
      where: {
        userid: {
          [Op.in]: userIds.length > 0 ? userIds : [-1], // Use -1 if no users to prevent empty IN clause
        },
        date: {
          [Op.between]: [startDate, endDate],
        },
      },
      order: [["date", "ASC"]],
    });

    // Get unique dates from both milk given and milk delivered records
    const allDates = new Set();
    
    milkGivenRecords.forEach((r) => {
      const dateStr = moment(r.date).format("YYYY-MM-DD");
      allDates.add(dateStr);
    });
    
    milkDeliveredRecords.forEach((r) => {
      const dateStr = moment(r.date).format("YYYY-MM-DD");
      allDates.add(dateStr);
    });

    // Convert to sorted array
    const dates = Array.from(allDates).sort();

    // Process data by date - only for dates that have entries
    const reportData = dates.map((date) => {
      // Calculate milk given for this date (sum of morning and evening)
      const givenRecords = milkGivenRecords.filter((r) => {
        const recordDate = moment(r.date).format("YYYY-MM-DD");
        return recordDate === date;
      });
      let pureGiven = 0;
      let cowGiven = 0;
      let buffaloGiven = 0;
      let milkGiven = 0;
      givenRecords.forEach((record) => {
        const pure = parseFloat(record.pure_quantity || 0);
        const cow = parseFloat(record.cow_quantity || 0);
        const buffalo = parseFloat(record.buffalo_quantity || 0);
        pureGiven += pure;
        cowGiven += cow;
        buffaloGiven += buffalo;
        milkGiven += pure + cow + buffalo;
      });

      // Calculate milk delivered for this date
      const deliveredRecords = milkDeliveredRecords.filter((r) => {
        const recordDate = moment(r.date).format("YYYY-MM-DD");
        return recordDate === date;
      });
      let pureDelivered = 0;
      let cowDelivered = 0;
      let buffaloDelivered = 0;
      let milkDelivered = 0;
      deliveredRecords.forEach((record) => {
        const quantities = Array.isArray(record.quantity_array)
          ? record.quantity_array
          : JSON.parse(record.quantity_array || "[]");
        // quantity_array format: [pure, cow, buffalo]
        const pure = parseFloat(quantities[0] || 0);
        const cow = parseFloat(quantities[1] || 0);
        const buffalo = parseFloat(quantities[2] || 0);
        pureDelivered += pure;
        cowDelivered += cow;
        buffaloDelivered += buffalo;
        milkDelivered += pure + cow + buffalo;
      });

      // Calculate remaining milk
      const remainingMilk = milkGiven - milkDelivered;
      const pureRemaining = pureGiven - pureDelivered;
      const cowRemaining = cowGiven - cowDelivered;
      const buffaloRemaining = buffaloGiven - buffaloDelivered;

      // Ensure all values are numbers, not NaN or null
      const milkGivenNum = isNaN(milkGiven) ? 0 : Number(milkGiven);
      const milkDeliveredNum = isNaN(milkDelivered) ? 0 : Number(milkDelivered);
      const remainingMilkNum = isNaN(remainingMilk) ? 0 : Number(remainingMilk);

      return {
        date: date,
        milk_given: parseFloat(milkGivenNum.toFixed(2)),
        milk_delivered: parseFloat(milkDeliveredNum.toFixed(2)),
        remaining_milk: parseFloat(remainingMilkNum.toFixed(2)),
        // Individual milk types
        pure_given: parseFloat((isNaN(pureGiven) ? 0 : Number(pureGiven)).toFixed(2)),
        cow_given: parseFloat((isNaN(cowGiven) ? 0 : Number(cowGiven)).toFixed(2)),
        buffalo_given: parseFloat((isNaN(buffaloGiven) ? 0 : Number(buffaloGiven)).toFixed(2)),
        pure_delivered: parseFloat((isNaN(pureDelivered) ? 0 : Number(pureDelivered)).toFixed(2)),
        cow_delivered: parseFloat((isNaN(cowDelivered) ? 0 : Number(cowDelivered)).toFixed(2)),
        buffalo_delivered: parseFloat((isNaN(buffaloDelivered) ? 0 : Number(buffaloDelivered)).toFixed(2)),
        pure_remaining: parseFloat((isNaN(pureRemaining) ? 0 : Number(pureRemaining)).toFixed(2)),
        cow_remaining: parseFloat((isNaN(cowRemaining) ? 0 : Number(cowRemaining)).toFixed(2)),
        buffalo_remaining: parseFloat((isNaN(buffaloRemaining) ? 0 : Number(buffaloRemaining)).toFixed(2)),
      };
    });

    res.status(200).json({
      success: true,
      delivery_boy: {
        id: deliveryBoy.id,
        name: deliveryBoy.name,
        email: deliveryBoy.email,
      },
      month: month,
      year: year,
      data: reportData,
    });
  } catch (error) {
    console.error("Error fetching delivery boy monthly report:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ NEW: Get customer dairy info (for dairy card)
module.exports.getCustomerDairyInfo = async (req, res) => {
  try {
    const { id } = req.params; // customer/user id
    const { dairy_name } = req.user;

    if (!dairy_name) {
      return res
        .status(403)
        .json({ message: "Unauthorized: No dairy association found." });
    }

    // Ensure the requested user belongs to the same dairy
    const user = await User.findOne({ where: { id, dairy_name } });

    if (!user) {
      return res.status(403).json({
        message: "Unauthorized: This user does not belong to your dairy.",
      });
    }

    // Get admin info for dairy logo
    const admin = await Admin.findOne({ where: { dairy_name } });

    res.status(200).json({
      dairy_name: dairy_name,
      dairy_logo: admin?.qr_image || null,
      admin_name: user.name || "Customer", // Return customer name, not admin name
      customer_name: user.name || "Customer", // Also include customer_name for clarity
    });
  } catch (error) {
    console.error("Error fetching customer dairy info:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ NEW: Get customer delivered orders (for dairy card)
module.exports.getCustomerDeliveredOrders = async (req, res) => {
  try {
    const { id } = req.params; // customer/user id
    const { dairy_name } = req.user;

    if (!dairy_name) {
      return res
        .status(403)
        .json({ message: "Unauthorized: No dairy association found." });
    }

    // Ensure the requested user belongs to the same dairy
    const user = await User.findOne({ where: { id, dairy_name } });

    if (!user) {
      return res.status(403).json({
        message: "Unauthorized: This user does not belong to your dairy.",
      });
    }

    const deliveredOrders = await DeliveryStatus.findAll({
      where: { userid: id },
      attributes: ["delivery_id", "shift", "quantity_array", "date", "status"],
      order: [["date", "DESC"]],
    });

    // Return 200 with empty array if no orders
    if (!deliveredOrders || deliveredOrders.length === 0) {
      return res.status(200).json({
        message: "Delivered orders fetched successfully.",
        orders: [],
      });
    }

    // Transform quantity_array into separate fields
    const transformedOrders = deliveredOrders.map((order) => {
      // Parse quantity_array - handle double-stringified JSON
      let quantities;
      if (typeof order.quantity_array === "string") {
        const firstParse = JSON.parse(order.quantity_array);
        // If still a string after first parse, parse again (double-stringified)
        quantities = typeof firstParse === "string" 
          ? JSON.parse(firstParse)
          : firstParse;
      } else {
        quantities = order.quantity_array;
      }

      // NOTE: quantity_array format is [pure, cow, buffalo]
      // If marked not present, keep quantities zero for UI
      const isNotPresent = order.status === false || order.status === 0 || order.status === "false";
      const safeQuantities = isNotPresent ? [0, 0, 0] : quantities;

      return {
        delivery_id: order.delivery_id,
        shift: order.shift,
        pure_quantity: safeQuantities[0] || 0,
        cow_quantity: safeQuantities[1] || 0,
        buffalo_quantity: safeQuantities[2] || 0,
        date: order.date,
        order_date: order.date, // alias for frontend compatibility
        status: order.status,
      };
    });

    res.status(200).json({
      message: "Delivered orders fetched successfully.",
      orders: transformedOrders,
    });
  } catch (error) {
    console.error("Error fetching customer delivered orders:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ NEW: Get customer payment summary (for dairy card)
// This function recalculates payment like the user endpoint to ensure accuracy
module.exports.getCustomerPaymentSummary = async (req, res) => {
  try {
    const { id } = req.params; // customer/user id
    const { dairy_name } = req.user;

    if (!dairy_name) {
      return res
        .status(403)
        .json({ message: "Unauthorized: No dairy association found." });
    }

    // Ensure the requested user belongs to the same dairy
    const user = await User.findOne({ where: { id, dairy_name } });

    if (!user) {
      return res.status(403).json({
        message: "Unauthorized: This user does not belong to your dairy.",
      });
    }

    // Get admin to fetch rates
    const admin = await Admin.findOne({ where: { dairy_name } });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found for this dairy." });
    }

    const { cow_rate, buffalo_rate, pure_rate, delivery_charges } = admin;

    // Get all payment history first
    const allPayments = await PaymentDetails.findAll({
      where: { userid: id },
      order: [["month_year", "ASC"]],
    });

    const currentMonthYear = moment().tz("Asia/Kolkata").format("YYYY-MM");

    // Calculate current month payment (recalculate like user endpoint)
    const startDate = moment()
      .tz("Asia/Kolkata")
      .startOf("month")
      .format("YYYY-MM-DD");
    const endDate = moment()
      .tz("Asia/Kolkata")
      .endOf("month")
      .format("YYYY-MM-DD");

    // Get current month deliveries (only delivered orders, exclude "Not Present")
    const currentMonthDeliveries = await DeliveryStatus.findAll({
      where: {
        userid: id,
        status: true, // Only count delivered orders
        date: {
          [Op.between]: [startDate, endDate],
        },
      },
    });

    let totalMilkPayment = 0;

    for (const delivery of currentMonthDeliveries) {
      let quantities;
      
      // Parse quantity_array - handle double-stringified JSON
      if (typeof delivery.quantity_array === 'string') {
        const firstParse = JSON.parse(delivery.quantity_array);
        // If still a string after first parse, parse again (double-stringified)
        quantities = typeof firstParse === 'string' 
          ? JSON.parse(firstParse)
          : firstParse;
      } else if (Array.isArray(delivery.quantity_array)) {
        quantities = delivery.quantity_array;
      } else {
        console.error('Invalid quantity_array format:', delivery.quantity_array);
        continue;
      }

      // NOTE: quantity_array format is [pure, cow, buffalo]
      const pure = Number(quantities[0]) || 0;
      const cow = Number(quantities[1]) || 0;
      const buffalo = Number(quantities[2]) || 0;
      
      totalMilkPayment +=
        cow * cow_rate + buffalo * buffalo_rate + pure * pure_rate;
    }

    // Get last month's pending payment
    const lastMonth = moment()
      .tz("Asia/Kolkata")
      .subtract(1, "months")
      .format("YYYY-MM");
    const lastPayment = await PaymentDetails.findOne({
      where: { userid: id, month_year: lastMonth },
    });

    const previousPending = lastPayment ? lastPayment.pending_payment : 0;
    const finalPayment =
      totalMilkPayment + (delivery_charges || 0) + previousPending;

    // Update or create current month payment record
    const existing = await PaymentDetails.findOne({
      where: { userid: id, month_year: currentMonthYear },
    });

    if (existing) {
      await PaymentDetails.update(
        {
          payment: totalMilkPayment,
          delivery_charges: delivery_charges || 0,
          pending_payment: finalPayment,
          advancePayment: user.advance_payment || 0,
        },
        { where: { userid: id, month_year: currentMonthYear } }
      );
    } else {
      await PaymentDetails.create({
        userid: id,
        start_date: user.start_date,
        month_year: currentMonthYear,
        payment: totalMilkPayment,
        delivery_charges: delivery_charges || 0,
        pending_payment: finalPayment,
        advancePayment: user.advance_payment || 0,
      });
    }

    // Fetch updated payment history
    const updatedPaymentHistory = await PaymentDetails.findAll({
      where: { userid: id },
      attributes: [
        "payment_id",
        "start_date",
        "month_year",
        "payment",
        "delivery_charges",
        "received_payment",
        "pending_payment",
      ],
      order: [["month_year", "DESC"]],
    });

    // Transform to match frontend expectations
    const transformedHistory = updatedPaymentHistory.map((payment) => ({
      payment_id: payment.payment_id,
      start_date: payment.start_date,
      month_year: payment.month_year,
      payment: payment.payment || 0, // milk payment
      received_payment: payment.received_payment || 0,
      pending_payment: payment.pending_payment || 0,
      delivery_charges: payment.delivery_charges || 0,
      advancePayment: user.advance_payment || 0,
      status: payment.pending_payment === 0, // Calculate status based on pending payment
    }));

    res.status(200).json({
      message: "Payment summary fetched successfully.",
      paymentHistory: transformedHistory,
    });
  } catch (error) {
    console.error("Error fetching customer payment summary:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ NEW: Get customer rates (for dairy card)
module.exports.getCustomerRates = async (req, res) => {
  try {
    const { id } = req.params; // customer/user id
    const { dairy_name } = req.user;

    if (!dairy_name) {
      return res
        .status(403)
        .json({ message: "Unauthorized: No dairy association found." });
    }

    // Ensure the requested user belongs to the same dairy
    const user = await User.findOne({ where: { id, dairy_name } });

    if (!user) {
      return res.status(403).json({
        message: "Unauthorized: This user does not belong to your dairy.",
      });
    }

    // Get admin to fetch rates
    const admin = await Admin.findOne({ where: { dairy_name } });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found for this dairy." });
    }

    // Determine rate based on milk type
    let rate = 0;
    const milkType = user.milk_type?.toLowerCase();
    
    if (milkType === "cow") {
      rate = admin.cow_rate || 0;
    } else if (milkType === "buffalo") {
      rate = admin.buffalo_rate || 0;
    } else if (milkType === "pure") {
      rate = admin.pure_rate || 0;
    }

    res.status(200).json({
      message: "Rates fetched successfully.",
      rate: rate,
      quantity: user.quantity || 0,
      milk_type: user.milk_type || "",
    });
  } catch (error) {
    console.error("Error fetching customer rates:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get pending vacation notifications for admin
module.exports.getPendingVacationNotifications = async (req, res) => {
  try {
    const { dairy_name } = req.user;

    if (!dairy_name) {
      return res.status(403).json({ message: "Unauthorized: Dairy name missing." });
    }

    // Get all users under this admin's dairy
    const dairyUsers = await User.findAll({
      where: { dairy_name },
      attributes: ["id"],
    });

    const userIds = dairyUsers.map(user => user.id);

    if (userIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No customers found.",
        vacations: [],
      });
    }

    // Get all pending vacation notifications (not yet acknowledged by admin)
    const pendingVacations = await Vacation.findAll({
      where: {
        user_id: { [Op.in]: userIds },
        admin_notified: false,
      },
      include: [
        {
          model: User,
          as: "User",
          attributes: ["id", "name", "email", "contact", "shift"],
        },
      ],
      order: [["vacation_start", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Pending vacations fetched successfully.",
      vacations: pendingVacations,
      count: pendingVacations.length,
    });
  } catch (error) {
    console.error("Error fetching pending vacations:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Mark vacation notifications as acknowledged by admin
module.exports.acknowledgeVacationNotifications = async (req, res) => {
  try {
    const { vacation_ids } = req.body; // Array of vacation IDs to acknowledge
    const { dairy_name } = req.user;

    if (!dairy_name) {
      return res.status(403).json({ message: "Unauthorized: Dairy name missing." });
    }

    if (!vacation_ids || !Array.isArray(vacation_ids) || vacation_ids.length === 0) {
      return res.status(400).json({ message: "Vacation IDs are required." });
    }

    // Verify that these vacations belong to this admin's dairy
    const vacations = await Vacation.findAll({
      where: { id: { [Op.in]: vacation_ids } },
      include: [
        {
          model: User,
          as: "User",
          where: { dairy_name },
          attributes: ["id"],
        },
      ],
    });

    if (vacations.length === 0) {
      return res.status(404).json({ message: "No matching vacations found." });
    }

    // Mark as notified
    await Vacation.update(
      {
        admin_notified: true,
        admin_notified_at: moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss"),
      },
      {
        where: { id: { [Op.in]: vacation_ids } },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Vacation notifications acknowledged successfully.",
      acknowledged_count: vacations.length,
    });
  } catch (error) {
    console.error("Error acknowledging vacation notifications:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
