const cron = require("node-cron");
const { Op } = require("sequelize");
const DeliveryStatus = require("../models/DeliveryStatus");
const User = require("../models/User");
const Admin = require("../models/Admin");
const moment = require("moment-timezone");
const PaymentDetails = require("../models/payment_details");
const Vacation = require('../models/vacations'); // Adjust path as needed
const AdditionalOrder = require('../models/additinalOrder'); // Adjust path as needed

// function parseJSONtoArray(jsonString) {
//     try {
//         let array = JSON.parse(jsonString);
//         return Array.isArray(array) ? array : [0, 0, 0]; // Ensure it's an array
//     } catch (error) {
//         console.error("Error parsing JSON:", error);
//         return [0, 0, 0]; // Fallback default
//     }
// }

// Function to calculate and update monthly payments
// async function calculateMonthlyPayments() {
//     try {
//         const currentMonth = new Date().getMonth() + 1;
//         const currentYear = new Date().getFullYear();
//         const monthYear = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;
//         console.log(monthYear);

//         // Fetch all unique users who had deliveries in the current month
//         const userDeliveries = await DeliveryStatus.findAll({
//             where: {
//                 date: {
//                     [Op.between]: [
//                         `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`,
//                         `${currentYear}-${String(currentMonth).padStart(2, "0")}-31`,
//                     ],
//                 },
//             },
//             attributes: ["userid"],
//             group: ["userid"], // Get unique user IDs
//         });

//         for (const { userid } of userDeliveries) {
//             // Get user details
//             const user = await User.findOne({ where: { id: userid } });
//             if (!user) continue;
//             const { dairy_name, start_date } = user;
//             // console.log(dairy_name);
//             // Get rates and delivery charges from Admin table
//             const admin = await Admin.findOne({ where: { dairy_name } });
//             if (!admin) continue;

//             const { cow_rate, buffalo_rate, pure_rate, delivery_charges } = admin;
//             // console.log(cow_rate, buffalo_rate, pure_rate, delivery_charges);

//             // Fetch all deliveries for this user in the current month
//             const userDeliveries = await DeliveryStatus.findAll({
//                 where: {
//                     userid,
//                     date: {
//                         [Op.between]: [
//                             `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`,
//                             `${currentYear}-${String(currentMonth).padStart(2, "0")}-31`,
//                         ],
//                     },
//                 },
//             });

//             let totalMilkPayment = 0;

//             for (const delivery of userDeliveries) {
//                 let quantities = Array.isArray(delivery.quantity_array)
//                     ? delivery.quantity_array
//                     : parseJSONtoArray(delivery.quantity_array);

//                 const [cowQuantity, buffaloQuantity, pureQuantity] = quantities.map(q => Number(q) || 0);

//                 console.log("cow", cowQuantity, "buffalo", buffaloQuantity, "pure", pureQuantity);

//                 totalMilkPayment +=
//                     (cowQuantity * (cow_rate ?? 0)) +
//                     (buffaloQuantity * (buffalo_rate ?? 0)) +
//                     (pureQuantity * (pure_rate ?? 0));
//             }
//             // Fetch previous month's pending payment
//             const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
//             const lastYear = currentMonth === 1 ? currentYear - 1 : currentYear;
//             const lastMonthYear = `${lastYear}-${String(lastMonth).padStart(2, "0")}`;

//             const previousPayment = await PaymentDetails.findOne({
//                 where: { userid, month_year: lastMonthYear },
//             });
//             let deliverycharges = delivery_charges
//             if (deliverycharges === null || deliverycharges === undefined) {
//                 deliverycharges = 0;
//             }
//             // let previousStartDate = previousPayment ? previousPayment.start_date : user.start_date; // ✅ Use previous start date
//             const previousPending = previousPayment ? previousPayment.pending_payment : 0;
//             const finalPayment = totalMilkPayment + delivery_charges + previousPending;
//             const pendingPayment = finalPayment; // Assuming no payments received yet
//             // console.log("pendingPayment", pendingPayment, "payment", totalMilkPayment, "deliverycharges", deliverycharges);
//             // Check if an entry exists for this month
//             const existingPayment = await PaymentDetails.findOne({
//                 where: { userid, month_year: monthYear },
//             });

//             if (existingPayment) {
//                 // ✅ Update existing record
//                 await PaymentDetails.update(
//                     {

//                         delivery_charges: deliverycharges,
//                         pending_payment: pendingPayment,
//                         payment: totalMilkPayment,
//                     },
//                     { where: { userid, month_year: monthYear } }
//                 );
//                 // console.log(`🔄 Payment updated for User ${userid}: ₹${finalPayment}`);
//             } else {
//                 // ✅ Create a new record if not exists
//                 await PaymentDetails.create({
//                     userid,
//                     start_date: previousPayment.start_date, // First entry should use user’s start date
//                     month_year: monthYear,
//                     payment: totalMilkPayment,
//                     delivery_charges: deliverycharges,
//                     pending_payment: pendingPayment,

//                 });
//                 console.log(`✅ Payment created for User ${userid}: ₹${finalPayment}`);
//             }
//         }
//     } catch (error) {
//         console.error("❌ Error calculating monthly payments:", error);
//     }
// }

// Schedule the job to run at 11 PM on the last day of the month
// cron.schedule("0 23 L * *", async () => {
//     console.log("🕚 Running monthly payment calculation for all users...");
//     await calculateMonthlyPayments();
// });
// Schedule the job to run every minute for testing
// cron.schedule("*/1 * * * *", async () => {
//     console.log("🕐 Running monthly payment calculation for all users (TEST MODE)...");
//     await calculateMonthlyPayments();
// });





// // 2. reset_admin_status
// cron.schedule('5 0 * * *', async () => {
//     const today = new Date().toISOString().slice(0, 10);
//     try {
//         await Admin.update(
//             { request: false },
//             { where: { end_date: today } }
//         );
//         console.log(`[CRON] Admin request status reset.`);
//     } catch (err) {
//         console.error(`[CRON] Error resetting admin request status:`, err.message);
//     }
// });

// 3. reset_delivery_status
// 1. Activate vacation mode – 11:30 PM
// cron.schedule('30 23 * * *', async ()
cron.schedule('30 23 * * *', async () => {
    const today = new Date().toISOString().slice(0, 10);
    try {
        const vacations = await Vacation.findAll({ where: { vacation_start: today } });

        for (const vac of vacations) {
            const user = await User.findByPk(vac.user_id);
            if (!user) continue;

            if (vac.shift === 'morning' || vac.shift === 'both') {
                user.vacation_mode_morning = true;
            }
            if (vac.shift === 'evening' || vac.shift === 'both') {
                user.vacation_mode_evening = true;
            }

            await user.save();
        }

        console.log(`[CRON] ✅ Vacation mode activated at 11:30 PM`);
    } catch (err) {
        console.error(`[CRON] ❌ Error activating vacation mode:`, err.message);
    }
});

// 2. Reset delivery flags – 11:45 PM
// cron.schedule('45 23 * * *', async () => {
cron.schedule('45 23 * * *', async () => {
    try {
        await User.update(
            { delivered_morning: false, delivered_evening: false },
            { where: {} }
        );
        console.log(`[CRON] ✅ Delivery flags reset at 11:45 PM`);
    } catch (err) {
        console.error(`[CRON] ❌ Error resetting delivery flags:`, err.message);
    }
});

// 3. Reset vacation mode – 12:00 AM
cron.schedule('0 23 * * *', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const targetDate = yesterday.toISOString().slice(0, 10);

    try {
        const vacations = await Vacation.findAll({ where: { vacation_end: targetDate } });

        for (const vac of vacations) {
            const user = await User.findByPk(vac.user_id);
            if (!user) continue;

            if (vac.shift === 'morning' || vac.shift === 'both') {
                user.vacation_mode_morning = false;
            }
            if (vac.shift === 'evening' || vac.shift === 'both') {
                user.vacation_mode_evening = false;
            }

            await user.save();
        }

        console.log(`[CRON] ✅ Vacation mode reset at 12:00 AM`);
    } catch (err) {
        console.error(`[CRON] ❌ Error resetting vacation mode:`, err.message);
    }
});

// module.exports = calculateMonthlyPayments;

// ⏰ Schedule: Runs daily at 2:00 PM IST (8:30 AM UTC)
cron.schedule("01 14 * * *", async () => {
    try {
        const now = moment().tz("Asia/Kolkata");
        const today = now.format("YYYY-MM-DD");

        // console.log("⏳ 2 PM Cron: Auto-updating pending morning deliveries...");

        // 1️⃣ Fetch users who haven't been delivered in the morning
        const pendingUsers = await User.findAll({
            where: {
                request: true,
                vacation_mode_morning: false,
                delivered_morning: false,
                start_date: { [Op.lte]: today },
            },
        });

        for (const user of pendingUsers) {
            if (user.milk_type == "buffalo") {
                quantityArray = [0, Number(user.quantity) || 0, 0];
            }
            else if (user.milk_type == "cow") {
                quantityArray = [Number(user.quantity) || 0, 0, 0];
            }
            else if (user.milk_type == "pure") {
                quantityArray = [0, 0, Number(user.quantity) || 0];
            }

            // Insert into DeliveryStatus
            await DeliveryStatus.create({
                userid: user.id,
                quantity_array: JSON.stringify(quantityArray),
                shift: "morning",
                status: true,
                date: today,
            });

            // Mark user as delivered
            await User.update(
                { delivered_morning: true },
                { where: { id: user.id } }
            );
        }

        // 2️⃣ Auto-update additional morning orders
        const additionalOrders = await AdditionalOrder.findAll({
            where: {
                shift: "morning",
                date: today,
            },
            include: {
                model: User,
                as: "user",
                where: {
                    delivered_morning: false,
                },
            },
        });

        for (const order of additionalOrders) {
            const user = order.user;
            const quantityArray = order.quantity_array;


            await DeliveryStatus.create({
                userid: user.id,
                quantity_array: quantityArray,
                shift: "morning",
                status: true,
                date: today,
            });

            await AdditionalOrder.update(
                { status: true },
                { where: { additinalOrder_id: order.additinalOrder_id } }
            );

            await User.update(
                { delivered_morning: true },
                { where: { id: user.id } }
            );
        }

        // console.log("✅ Auto-update complete for morning deliveries.");
    } catch (error) {
        console.error("❌ Cron Error:", error.message);
    }
});

// ⏰ Schedule: Runs daily at 11:30 PM IST for evening deliveries
cron.schedule("30 23 * * *", async () => {
    try {
        const now = moment().tz("Asia/Kolkata");
        const today = now.format("YYYY-MM-DD");

        // console.log("⏳ 11:30 PM Cron: Auto-updating pending evening deliveries...");

        // 1️⃣ Fetch users who haven't been delivered in the evening
        const pendingUsers = await User.findAll({
            where: {
                request: true,
                vacation_mode_evening: false,
                delivered_evening: false,
                start_date: { [Op.lte]: today },
            },
        });

        for (const user of pendingUsers) {
            let quantityArray;
            if (user.milk_type == "buffalo") {
                quantityArray = [0, Number(user.quantity) || 0, 0];
            }
            else if (user.milk_type == "cow") {
                quantityArray = [Number(user.quantity) || 0, 0, 0];
            }
            else if (user.milk_type == "pure") {
                quantityArray = [0, 0, Number(user.quantity) || 0];
            }

            // Insert into DeliveryStatus
            await DeliveryStatus.create({
                userid: user.id,
                quantity_array: JSON.stringify(quantityArray),
                shift: "evening",
                status: true,
                date: today,
            });

            // Mark user as delivered
            await User.update(
                { delivered_evening: true },
                { where: { id: user.id } }
            );
        }

        // 2️⃣ Auto-update additional evening orders
        const additionalOrders = await AdditionalOrder.findAll({
            where: {
                shift: "evening",
                date: today,
            },
            include: {
                model: User,
                as: "user",
                where: {
                    delivered_evening: false,
                },
            },
        });

        for (const order of additionalOrders) {
            const user = order.user;
            const quantityArray = order.quantity_array;

            await DeliveryStatus.create({
                userid: user.id,
                quantity_array: quantityArray,
                shift: "evening",
                status: true,
                date: today,
            });

            await AdditionalOrder.update(
                { status: true },
                { where: { additinalOrder_id: order.additinalOrder_id } }
            );

            await User.update(
                { delivered_evening: true },
                { where: { id: user.id } }
            );
        }

        // console.log("✅ Auto-update complete for evening deliveries.");
    } catch (error) {
        console.error("❌ Cron Error (Evening):", error.message);
    }
});