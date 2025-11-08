const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Admin = require("../models/Admin");
const SuperAdmin = require("../models/SuperAdmin");
const DeliveryBoy = require("../models/DeliveryBoy");
const DeliveryStatus = require("../models/DeliveryStatus");
const Vacation = require("../models/vacations");
const AdditionalOrder = require("../models/additinalOrder");
const { Op } = require("sequelize");
const moment = require("moment");
const PaymentDetails = require("../models/payment_details"); // Import PaymentDetails
const Farmer = require("../models/Farmer");

const admin = require('../utils/firebase'); // Firebase Admin SDK

module.exports.registeredUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password_hash,
      contact,
      address,
      dairy_name,
      milk_type,
      quantity,
      shift,
    } = req.body;

    // 🔹 Check if email already exists in any role
    const emailExists = await Promise.all([
      DeliveryBoy.findOne({ where: { email } }),
      SuperAdmin.findOne({ where: { email } }),
      Admin.findOne({ where: { email } }),
      User.findOne({ where: { email } }),
      Farmer.findOne({ where: { email } }),
    ]);

    if (emailExists.some((user) => user !== null)) {
      return res.status(400).json({ message: "Email already exists in another role." });
    }

    // 🔹 Check if contact already exists in any role
    const contactExists = await Promise.all([
      DeliveryBoy.findOne({ where: { contact } }),
      SuperAdmin.findOne({ where: { contact } }),
      Admin.findOne({ where: { contact } }),
      User.findOne({ where: { contact } }),
      Farmer.findOne({ where: { contact } }),
    ]);

    if (contactExists.some((user) => user !== null)) {
      return res.status(400).json({ message: "Contact number already exists in another role." });
    }

    // 🔹 Determine vacation mode
    let vacation_mode_morning = false;
    let vacation_mode_evening = false;
    if (shift === "morning") vacation_mode_evening = true;
    else if (shift === "evening") vacation_mode_morning = true;

    // 🔹 Create new user
    const newUser = await User.create({
      name,
      email,
      password_hash,
      contact,
      address,
      dairy_name,
      milk_type,
      quantity,
      shift,
      vacation_mode_morning,
      vacation_mode_evening,
    });

    // 🔹 Send FCM notification to related admin(s)
    const admins = await Admin.findOne({ where: { dairy_name } });
    const fcmTokens = admins.fcm_token ? admins.fcm_token.split(",") : [];


    const message = {
      notification: {
        title: 'New User Registered',
        body:`${name} has registered with ${dairy_name}`,
        image: '/notification.png', // <-- Add your image URL here
      },
      data: {
        redirect_url: "https://duddairy.spectrasynth.com/user-request", 
      },
      tokens: fcmTokens,
    };
    // console.log(message);
    try {
      const response = await admin.messaging().sendEachForMulticast(message);
      // console.log(`FCM sent to ${response.successCount} admin(s).`);
    } catch (fcmErr) {
      console.error('FCM Error:', fcmErr);
    }


    return res.status(201).json({ message: "User registered successfully", user: newUser });

  } catch (err) {
    console.error("Registration Error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


const isValidDateFormat = (dateString) => {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(dateString) && !isNaN(Date.parse(dateString))
  );
};

module.exports.add_vacation = async (req, res) => {
  try {
    const { vacation_start, vacation_end, shift } = req.body;
    const user_id = req.user.id;

    // Validate user
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Validate required fields
    if (!vacation_start || !shift) {
      return res
        .status(400)
        .json({ message: "Vacation start date and shift are required." });
    }

    // Validate date formats
    if (!isValidDateFormat(vacation_start)) {
      return res.status(400).json({
        message: "Invalid vacation start date format. Use YYYY-MM-DD.",
      });
    }
    if (vacation_end && !isValidDateFormat(vacation_end)) {
      return res
        .status(400)
        .json({ message: "Invalid vacation end date format. Use YYYY-MM-DD." });
    }

    // Convert to Date objects
    const startDate = new Date(vacation_start);
    const endDate = vacation_end ? new Date(vacation_end) : new Date(startDate);

    // Ensure valid date objects
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ message: "Invalid vacation dates." });
    }

    // Validate start date (must be in the future)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (startDate < today) {
      return res
        .status(400)
        .json({ message: "Vacation start date must be in the future." });
    }

    if (endDate < startDate) {
      return res
        .status(400)
        .json({ message: "Vacation end date cannot be before start date." });
    }

    // Ensure valid shift
    const validShifts = ["morning", "evening", "both"];
    if (!validShifts.includes(shift)) {
      return res.status(400).json({ message: "Invalid shift value." });
    }

    // 🔹 Check if vacation mode is already on for the selected shift
    if (shift === "morning" && user.vacation_mode_morning) {
      return res.status(400).json({
        message: "Vacation mode is already ON for the morning shift.",
      });
    }
    if (shift === "evening" && user.vacation_mode_evening) {
      return res.status(400).json({
        message: "Vacation mode is already ON for the evening shift.",
      });
    }

    // Check existing vacation mode in the Vacation table
    const existingVacation = await Vacation.findOne({
      where: { user_id, vacation_start: startDate },
    });

    if (
      existingVacation &&
      ((existingVacation.shift === "morning" && shift === "morning") ||
        (existingVacation.shift === "evening" && shift === "evening") ||
        existingVacation.shift === "both")
    ) {
      return res.status(400).json({
        message: "Vacation mode is already on for this date and shift.",
      });
    }

    // Calculate vacation days
    let vacationDays =
      Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    if (shift === "morning" || shift === "evening") vacationDays *= 0.5;

    // Update total vacation days
    const totalVacationDays = (user.vacation_days ?? 0) + vacationDays;

    // Format Dates
    const startDateISO = startDate.toISOString().split("T")[0];
    const endDateISO = endDate.toISOString().split("T")[0];

    // Insert Vacation Record
    await Vacation.create({
      user_id,
      vacation_start: startDateISO,
      vacation_end: endDateISO,
      shift,
    });
    // Update vacation days in the User table
    await user.update({ vacation_days: totalVacationDays });
    return res.status(201).json({
      message: "Vacation added successfully.",
      vacation_start: startDateISO,
      vacation_end: endDateISO,
      vacation_days: vacationDays,
      total_vacation_days: totalVacationDays,
    });
  } catch (error) {
    console.error("Error in add_vacation:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

module.exports.getRate = async (req, res) => {
  try {
    // 🔹 Extract user ID from JWT token
    const { id } = req.user;

    // 🔹 Find the user from the database
    const user = await User.findOne({
      where: { id },
      attributes: ["milk_type", "dairy_name", "quantity"], // Fetch only needed fields
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // 🔹 Fetch the corresponding dairy admin's rates
    const admin = await Admin.findOne({
      where: { dairy_name: user.dairy_name },
      attributes: ["cow_rate", "buffalo_rate", "pure_rate", "delivery_charges"], // Fetch only rate-related fields
    });

    if (!admin) {
      return res
        .status(404)
        .json({ message: "Admin not found for this dairy." });
    }

    // 🔹 Determine correct rate based on user's milk type
    let userMilkRate;
    switch (user.milk_type.toLowerCase()) {
      case "cow":
        userMilkRate = admin.cow_rate;
        break;
      case "buffalo":
        userMilkRate = admin.buffalo_rate;
        break;
      case "pure":
        userMilkRate = admin.pure_rate;
        break;
      default:
        return res.status(400).json({ message: "Invalid milk type." });
    }

    return res.status(200).json({
      message: "Rate fetched successfully.",
      milk_type: user.milk_type,
      delivery_charges: admin.delivery_charges,
      quantity: user.quantity,
      rate: userMilkRate, // ✅ Returns only the rate for the user's milk type
    });
  } catch (error) {
    console.error("Error fetching milk rate:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports.getPaymentDetails = async (req, res) => {
  try {
    // Extract dairy_name from JWT token
    const { dairy_name } = req.user;

    // Check if the Admin exists
    const admin = await Admin.findOne({
      where: { dairy_name },
      attributes: [
        "dairy_name",
        "qr_image",
        "upi_address",
        "bank_name",
        "branch_name",
        "account_number",
        "ifsc_code",
      ],
    });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    return res.status(200).json({
      message: "Payment details fetched successfully",
      payment_details: {
        admin_name: admin.dairy_name,
        qr_image: admin.qr_image ? admin.qr_image.toString("base64") : null,
        upi_address: admin.upi_address,
        bank_name: admin.bank_name,
        branch_name: admin.branch_name,
        account_number: admin.account_number,
        ifsc_code: admin.ifsc_code,
      },
    });
  } catch (error) {
    console.error("Error fetching payment details:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports.getVacationDate = async (req, res) => {
  try {
    const { id } = req.user; // Extract user ID from authenticated user
    // console.log(id);
    // Fetch vacations for the logged-in user
    const vacations = await Vacation.findAll({
      where: { user_id: id },
    });

    if (!vacations.length) {
      return res.status(404).json({ message: "No vacation records found." });
    }

    return res.status(200).json({
      message: "Vacation records fetched successfully.",
      vacations,
    });
  } catch (error) {
    console.error("Error fetching vacation records:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// module.exports.getDeliveredOrder = async (req, res) => {
//     try {
//         // 🔹 Extract user ID from JWT token
//         const { id } = req.user;

//         // 🔹 Find delivered orders for this user
//         const deliveredOrders = await DeliveryStatus.findAll({
//             where: {
//                 userid: id,   // Fetch only orders belonging to this user
//                 // status: true  // Only fetch orders with status = true (delivered)
//             },
//             attributes: ["delivery_id", "shift", "milk_type", "quantity", "date", "status"],
//         });

//         // 🔹 Check if orders exist
//         if (deliveredOrders.length === 0) {
//             return res.status(404).json({ message: "No delivered orders found." });
//         }

//         return res.status(200).json({
//             message: "Delivered orders fetched successfully.",
//             orders: deliveredOrders
//         });

//     } catch (error) {
//         console.error("Error fetching delivered orders:", error);
//         res.status(500).json({ message: "Internal server error", error: error.message });
//     }
// }

module.exports.getDeliveredOrder = async (req, res) => {
  try {
    // 🔹 Extract user ID from JWT token
    const { id } = req.user;

    // 🔹 Find delivered orders for this user
    const deliveredOrders = await DeliveryStatus.findAll({
      where: { userid: id },
      attributes: ["delivery_id", "shift", "quantity_array", "date", "status"],
    });

    // 🔹 Check if orders exist
    if (deliveredOrders.length === 0) {
      return res.status(404).json({ message: "No delivered orders found." });
    }

    // 🔹 Transform quantity_array into separate fields
    const transformedOrders = deliveredOrders.map((order) => {
      const quantities = JSON.parse(order.quantity_array); // Convert string to array

      return {
        delivery_id: order.delivery_id,
        shift: order.shift,
        cow_quantity: quantities[0] || 0, // Ensure default value if missing
        buffalo_quantity: quantities[1] || 0,
        pure_quantity: quantities[2] || 0,
        date: order.date,
        status: order.status,
      };
    });

    return res.status(200).json({
      message: "Delivered orders fetched successfully.",
      orders: transformedOrders,
    });
  } catch (error) {
    console.error("Error fetching delivered orders:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports.getNotPresentOrder = async (req, res) => {
  try {
    // 🔹 Extract user ID from JWT token
    const { id } = req.user;

    // 🔹 Find delivered orders for this user
    const deliveredOrders = await DeliveryStatus.findAll({
      where: {
        userid: id, // Fetch only orders belonging to this user
        status: false, // Only fetch orders with status = true (delivered)
      },
      attributes: [
        "delivery_id",
        "shift",
        "milk_type",
        "quantity",
        "date",
        "timestamp",
      ],
    });

    // 🔹 Check if orders exist
    if (deliveredOrders.length === 0) {
      return res.status(404).json({ message: "orders found." });
    }

    return res.status(200).json({
      message: "Not present orders fetched successfully.",
      orders: deliveredOrders,
    });
  } catch (error) {
    console.error("Error fetching Not Present orders:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports.startDate = async (req, res) => {
  try {
    const { id } = req.user; // Extracting dairy_name from JWT token

    if (!id) {
      return res.status(400).json({ message: "id is required." });
    }

    const user = await User.findOne({
      where: { id },
      attributes: ["start_date"],
    });

    if (!user) {
      return res.status(404).json({ message: "user not found." });
    }

    res.json({ start_date: user.start_date });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports.profile = async (req, res) => {
  try {
    const { id } = req.user; // Extracting dairy_name from JWT token

    if (!id) {
      return res.status(400).json({ message: "Id is required." });
    }

    const user = await User.findOne({
      where: { id },
      attributes: ["name", "dairy_name", "email", "contact", "address"],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports.updatePaymentDetails = async (req, res) => {
  try {
    // Extract user ID from JWT token
    const userId = req.user.id;

    let qr_image = null;
    if (req.file) {
      qr_image = req.file.buffer; // Store image as buffer
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.qr_image = qr_image || user.qr_image;

    await user.save({ validate: false });

    res
      .status(200)
      .json({ message: "Payment details updated successfully", user });
  } catch (error) {
    res.status(500).json({
      message: "Error updating payment details",
      error: error.message,
    });
  }
};

module.exports.getLastMonthPayment = async (req, res) => {
  try {
    // 🔹 Extract user ID from the JWT token
    const { id: userid } = req.user;

    if (!userid) {
      return res
        .status(403)
        .json({ message: "Unauthorized: User ID missing from token." });
    }

    // 🔹 Get last month's date in "YYYY-MM" format
    let lastMonth = moment()
      .tz("Asia/Kolkata")
      .subtract(1, "months")
      .format("YYYY-MM");

    const lastMonthPayment = await PaymentDetails.findOne({
      where: { userid: userid, month_year: lastMonth },
      attributes: [
        "pending_payment",
        "received_payment",
        "payment",
        "delivery_charges",
        "start_date",
      ],
    });

    let lastMonthRemaining = 0;
    let paymentStatus = true;

    if (lastMonthPayment) {
      lastMonthRemaining =
        lastMonthPayment.pending_payment -
        (lastMonthPayment.received_payment + lastMonthPayment.delivery_charges);
      paymentStatus = lastMonthPayment.pending_payment === 0 ? true : false;
      if (lastMonthRemaining < 0) {
        lastMonthRemaining = 0;
      }
    }

    // 🔹 Fetch user's advance payment from the User table
    const user = await User.findOne({
      where: { id: userid },
      attributes: ["advance_payment"],
    });

    return res.status(200).json({
      message: "Payment details updated successfully",
      lastMonthPayment: lastMonthPayment ? lastMonthPayment : 0,
      lastMonthRemaining: lastMonthRemaining ? lastMonthRemaining : 0,
      advancePayment: user ? user.advance_payment : 0,
      paymentStatus,
    });
  } catch (error) {
    console.error("Error fetching user payment records:", error.message);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports.getPaymentProof = async (req, res) => {
  try {
    const { id } = req.user; // Extracting dairy_name from JWT token

    if (!id) {
      return res.status(400).json({ message: "Id is required." });
    }

    const user = await User.findOne({
      where: { id },
      attributes: ["qr_image"],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports.getUserPaymentSummary = async (req, res) => {
  try {
    const { id: userid } = req.user;
    if (!userid) {
      return res
        .status(403)
        .json({ message: "Unauthorized: User ID missing from token." });
    }

    const allPayments = await PaymentDetails.findAll({
      where: { userid },
      order: [["month_year", "asc"]],
    });

    const currentMonthYear = moment().tz("Asia/Kolkata").format("YYYY-MM");

    // Find the first month where pending_payment = 0
    let startIndex = allPayments.findIndex((p) => p.pending_payment === 0);
    let status = false;
    let filteredPayments = [];

    if (startIndex !== -1) {
      filteredPayments = allPayments.filter(
        (p) =>
          moment(p.month_year).isSameOrAfter(
            allPayments[startIndex].month_year
          ) &&
          p.month_year < currentMonthYear &&
          p.pending_payment >= 0
      );
    } else {
      filteredPayments = allPayments.filter(
        (p) => p.month_year < currentMonthYear && p.pending_payment > 0
      );
      //  If even one payment has pending > 0, set status to false
    }

    // console.log("Filtered Payments:", filteredPayments);
    const user = await User.findOne({ where: { id: userid } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const admin = await Admin.findOne({
      where: { dairy_name: user.dairy_name },
    });
    if (!admin)
      return res
        .status(404)
        .json({ message: "Admin details not found for dairy." });

    const { cow_rate, buffalo_rate, pure_rate, delivery_charges } = admin;

    const startDate = moment()
      .tz("Asia/Kolkata")
      .startOf("month")
      .format("YYYY-MM-DD");
    const endDate = moment()
      .tz("Asia/Kolkata")
      .endOf("month")
      .format("YYYY-MM-DD");

    const currentMonthDeliveries = await DeliveryStatus.findAll({
      where: {
        userid,
        date: {
          [Op.between]: [startDate, endDate],
        },
      },
    });

    let totalMilkPayment = 0;

    for (const delivery of currentMonthDeliveries) {
      const quantities = Array.isArray(delivery.quantity_array)
        ? delivery.quantity_array
        : JSON.parse(delivery.quantity_array);

      const [cow, buffalo, pure] = quantities.map((q) => Number(q) || 0);
      totalMilkPayment +=
        cow * cow_rate + buffalo * buffalo_rate + pure * pure_rate;
    }

    const lastMonth = moment()
      .tz("Asia/Kolkata")
      .subtract(1, "months")
      .format("YYYY-MM");
    const lastPayment = await PaymentDetails.findOne({
      where: { userid, month_year: lastMonth },
    });

    const previousPending = lastPayment ? lastPayment.pending_payment : 0;
    const finalPayment =
      totalMilkPayment + (delivery_charges || 0) + previousPending;

    const existing = await PaymentDetails.findOne({
      where: { userid, month_year: currentMonthYear },
    });

    if (existing) {
      await PaymentDetails.update(
        {
          payment: totalMilkPayment,
          delivery_charges: delivery_charges || 0,
          pending_payment: finalPayment,
          advancePayment: user.advance_payment || 0,
        },
        { where: { userid, month_year: currentMonthYear } }
      );
    } else {
      await PaymentDetails.create({
        userid,
        start_date: user.start_date,
        month_year: currentMonthYear,
        payment: totalMilkPayment,
        delivery_charges: delivery_charges || 0,
        pending_payment: finalPayment,
        advancePayment: user.advance_payment || 0,
      });
    }

    const currentPayment = await PaymentDetails.findOne({
      where: {
        userid,
        month_year: currentMonthYear,
        pending_payment: { [Op.gt]: 0 }, // ✅ only if payment pending
      },
    });

    const allFiltered = [...filteredPayments];
    if (currentPayment) {
      allFiltered.push(currentPayment);
    }
    // Inject status into each payment object
    const paymentHistoryWithStatus = allFiltered.map((payment) => ({
      ...payment.toJSON(), // ensures Sequelize model is converted to plain object
      status: payment.pending_payment === 0,
    }));
    return res.status(200).json({
      message: "User payment summary fetched successfully.",
      paymentHistory: paymentHistoryWithStatus,
      // advancePayment: user.advance_payment || 0,
    });
  } catch (error) {
    console.error("Error fetching payment summary:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports.additinal_order = async (req, res) => {
  const { shift, quantity, date } = req.body;
  const userId = req.user.id;

  try {
    const now = new Date();
    const selectedDate = new Date(date);

    // Normalize today's and selected date for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    // 1. Check if the date is in the past
    if (selectedDate < today) {
      return res
        .status(400)
        .json({ message: "Date must be in the future or today." });
    }

    // 2. Time-based validation if selected date is today
    if (selectedDate.getTime() === today.getTime()) {
      const currentHour = now.getHours();

      if (shift === "morning" && currentHour >= 14) {
        return res.status(400).json({
          message:
            "Morning shift additional orders must be placed before 14:00 PM.",
        });
      }

      if (shift === "evening" && currentHour >= 22) {
        return res.status(400).json({
          message:
            "Evening shift additional orders must be placed before 10:00 PM.",
        });
      }
    }

    // 3. Fetch user and validate shift
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const originalShift = user.shift;

    if (originalShift === "both") {
      return res.status(400).json({
        message: "Additional order not allowed for users with 'both' shift.",
      });
    }

    if (originalShift === shift) {
      return res.status(400).json({
        message: `You can only place an additional order for the ${originalShift === "morning" ? "evening" : "morning"
          } shift only.`,
      });
    }

    // 🔍 3.5. Check if additional order already exists for this user, date, and shift
    const existingOrder = await AdditionalOrder.findOne({
      where: {
        userid: userId,
        date,
        shift,
      },
    });

    if (existingOrder) {
      return res.status(409).json({
        message: `An additional order for the ${shift} shift on ${date} already exists.`,
      });
    }

    // 4. Create the additional order
    const newOrder = await AdditionalOrder.create({
      userid: userId,
      shift,
      quantity_array: JSON.stringify(quantity),
      date,
    });

    const [cow_quantity, buffalo_quantity, pure_quantity] = JSON.parse(
      newOrder.quantity_array
    );

    const dairy_name = user.dairy_name;

    // 🔔 Send FCM notification to admin(s)
    const admins = await Admin.findOne({ where: { dairy_name } });
    const fcmTokens = admins.fcm_token ? admins.fcm_token.split(",") : [];

    const message = {
      notification: {
        title: 'New Order Placed by User',
        body: `${user.name} has placed an additional order: Cow Milk - ${cow_quantity}L, Buffalo Milk - ${buffalo_quantity}L, Pure Milk - ${pure_quantity}L for the ${shift} shift on ${date}.`,
        image: '/notification.png', // <-- Add your image URL here
      },
      data: {
        redirect_url: "https://duddairy.spectrasynth.com/additional-orders", // URL to redirect when the notification is clicked
      },
      tokens: fcmTokens,
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(message);
    } catch (fcmErr) {
      console.error('FCM Error:', fcmErr);
    }

    res.status(201).json({
      message: "Additional order added successfully",
      data: newOrder,
    });
  } catch (err) {
    console.error("Error adding additional order:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


module.exports.getAllRate = async (req, res) => {
  try {
    // 🔹 Extract user ID from JWT token
    const { id } = req.user;

    // 🔹 Find the user from the database
    const user = await User.findOne({
      where: { id },
      attributes: ["dairy_name"], // Fetch only needed fields
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // 🔹 Fetch the corresponding dairy admin's rates
    const admin = await Admin.findOne({
      where: { dairy_name: user.dairy_name },
      attributes: ["cow_rate", "buffalo_rate", "pure_rate", "delivery_charges"], // Fetch only rate-related fields
    });

    if (!admin) {
      return res
        .status(404)
        .json({ message: "Admin not found for this dairy." });
    }

    return res.status(200).json({
      message: "Rate fetched successfully.",
      // delivery_charges: admin.delivery_charges,
      cow_rate: admin.cow_rate,
      buffalo_rate: admin.buffalo_rate,
      pure_rate: admin.pure_rate,
    });
  } catch (error) {
    console.error("Error fetching milk rate:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
