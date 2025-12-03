const express = require("express");
const User = require("../models/User");
const DeliveryStatus = require("../models/DeliveryStatus");
const moment = require("moment-timezone");
const { Op } = require("sequelize");
const { sequelize } = require("../models");
const AdditionalOrder = require("../models/additinalOrder");


module.exports.UpdateDeliveryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { shift, cow_milk, buffalo_milk, pure_milk, delivery_status } = req.body;
        const { dairy_name } = req.user;
        // console.log(id);

        if (!dairy_name) {
            return res.status(403).json({ message: "Unauthorized: No dairy association found." });
        }

        if (!shift || !["morning", "evening"].includes(shift.toLowerCase())) {
            return res.status(400).json({ message: "Invalid shift. Use 'morning' or 'evening'." });
        }

        const now = moment().tz("Asia/Kolkata");
        const currentHour = now.hour();

        if (shift.toLowerCase() === "morning" && currentHour >= 14) {
            return res.status(400).json({ message: "Morning deliveries can only be updated until 14:00 PM." });
        }

        if (shift.toLowerCase() === "evening" && currentHour < 14) {
            return res.status(400).json({ message: "Evening deliveries can only be updated after 14:00 PM." });
        }

        const user = await User.findOne({ where: { id, dairy_name } });

        if (!user) {
            return res.status(403).json({ message: "Unauthorized: This user does not belong to your dairy." });
        }

        if (!user.request) {
            return res.status(400).json({ message: "User's request is not active. Delivery cannot be updated." });
        }

        if (shift.toLowerCase() === "morning" && user.delivered_morning) {
            return res.status(400).json({ message: "Morning delivery is already marked as delivered." });
        }
        if (shift.toLowerCase() === "evening" && user.delivered_evening) {
            return res.status(400).json({ message: "Evening delivery is already marked as delivered." });
        }

        const cowQuantity = Number(cow_milk) || 0;
        const buffaloQuantity = Number(buffalo_milk) || 0;
        const pureQuantity = Number(pure_milk) || 0;
        const quantityArray = [cowQuantity, buffaloQuantity, pureQuantity];

        let updateField = {};
        if (shift.toLowerCase() === "morning") {
            updateField = { delivered_morning: true };
        } else {
            updateField = { delivered_evening: true };
        }



        // Insert into DeliveryStatus table
        await DeliveryStatus.create({
            userid: id,
            quantity_array: JSON.stringify(quantityArray),
            shift: shift.toLowerCase(),
            status: delivery_status,
            date: now.format("YYYY-MM-DD"),
        });

        // ✅ Check and update today's additional order if exists
        const todayDate = now.format("YYYY-MM-DD");


        const additionalOrder = await AdditionalOrder.findOne({
            where: {
                userid: id,
                shift: shift.toLowerCase(),
                date: todayDate,
            },
        });
        // console.log("additionalOrder", additionalOrder);
        if (additionalOrder) {
            await AdditionalOrder.update(
                { status: true },
                {
                    where: {
                        additinalOrder_id: additionalOrder.additinalOrder_id,
                    },
                }
            );
        }

        await User.update(updateField, { where: { id } });
        return res.status(200).json({
            message: `Delivery status updated for ${shift} shift`,
            deliveredQuantities: {
                cowMilk: cowQuantity,
                buffaloMilk: buffaloQuantity,
                pureMilk: pureQuantity,
            },
        });
    } catch (error) {
        console.error("Error updating delivery status:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

module.exports.morningPendingOrders = async (req, res) => {
    try {
        // Extract admin's dairy name from the authenticated request
        const { dairy_name } = req.user;

        if (!dairy_name) {
            return res.status(403).json({ message: "Unauthorized: No dairy association found" });
        }

        // Get today's date and time in Indian Standard Time (IST) in YYYY-MM-DD HH:MM:SS format
        const now = new Date();
        const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000)); // Convert UTC to IST
        const today = new Date().toISOString().split("T")[0];

        // console.log("IST Date & Time:", today); // Debugging log

        // Fetch users with morning shift orders for today under this admin's dairy
        const morningOrders = await User.findAll({
            where: {
                dairy_name,
                request: true,
                vacation_mode_morning: false,
                delivered_morning: false,
                start_date: { [Op.lte]: today }, // Extract only the date for comparison
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
                    delivered_morning: false,
                },
            },
        });



        // 3️⃣ Check if both are empty
        if (morningOrders.length === 0 && additionalMorningOrders.length === 0) {
            return res.status(404).json({ message: "No morning orders found for today" });
        }

        // 4️⃣ Send combined result
        res.json({
            message: "Today's morning shift orders fetched successfully",
            regular_orders: morningOrders,
            additional_orders: additionalMorningOrders,
        });
    } catch (error) {
        console.error("Error fetching morning shift orders:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports.eveningPendingOrders = async (req, res) => {
    try {
        // Extract admin's dairy name from the authenticated request
        const { dairy_name } = req.user;

        if (!dairy_name) {
            return res.status(403).json({ message: "Unauthorized: No dairy association found" });
        }

        // Get today's date in Indian Standard Time (IST) in YYYY-MM-DD format
        const now = new Date();
        const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000)); // Convert UTC to IST
        const today = new Date().toISOString().split("T")[0];

        // console.log("IST Date:", today); // Debugging log

        // Fetch users with evening shift orders for today under this admin's dairy
        const eveningOrders = await User.findAll({
            where: {
                dairy_name,
                request: true,
                vacation_mode_evening: false,
                delivered_evening: false,
                start_date: { [Op.lte]: today }, // Compare only date
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
                    delivered_evening: false,
                },
            },
        });



        // 3️⃣ If both are empty
        if (eveningOrders.length === 0 && additionalEveningOrders.length === 0) {
            return res.status(404).json({ message: "No evening orders found for today" });
        }

        // 4️⃣ Send combined response
        res.json({
            message: "Today's evening shift orders fetched successfully",
            regular_orders: eveningOrders,
            additional_orders: additionalEveningOrders,
        });
    } catch (error) {
        console.error("Error fetching evening shift orders:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
module.exports.updateRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { request } = req.body;
        const { dairy_name } = req.user; // Extract admin's dairy name

        // Validate request input (must be true or false)
        if (typeof request !== "boolean") {
            return res.status(400).json({ message: "Invalid request value. Must be true or false." });
        }

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.dairy_name !== dairy_name) {
            return res.status(403).json({ message: "Unauthorized: You can only update users from your own dairy" });
        }

        // Update request status
        user.request = request;

        // Set start_date to tomorrow's date whenever request status is updated
        user.start_date = moment().tz("Asia/Kolkata").add(1, "days").format("YYYY-MM-DD");

        await user.save();

        res.json({ message: "Request status and start date updated successfully", user });
    } catch (error) {
        console.error("Error updating request status:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports.addDeliveryRecord = async (req, res) => {
    try {
        const { id, shift, quantity, date, status } = req.body;
        // console.log("quantity", quantity, quantity.length);

        // ✅ Validate required fields
        if (!id || !shift || !date) {
            return res
                .status(400)
                .json({ message: "Please provide all required fields." });
        }

        // ✅ Check if delivery boy exists


        // ✅ Create new delivery record
        const newRecord = await DeliveryStatus.create({
            userid: id, // Ensure the correct field name
            shift,
            quantity_array: JSON.stringify(quantity), // Store quantity as JSON string
            date,
            status: status ?? false, // Default to false if not provided
        });

        // ✅ Return success response
        res.status(201).json({
            message: "Delivery record inserted successfully!",
            data: newRecord,
        });
    } catch (error) {
        console.error("Error inserting delivery record:", error.message);
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};
