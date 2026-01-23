const cron = require("node-cron");
const { Op } = require("sequelize");
const DeliveryStatus = require("../models/DeliveryStatus");
const User = require("../models/User");
const Admin = require("../models/Admin");
const moment = require("moment-timezone");
const PaymentDetails = require("../models/payment_details");
const Vacation = require('../models/vacations'); // Adjust path as needed
const AdditionalOrder = require('../models/additinalOrder'); // Adjust path as needed

// Lock mechanism to prevent concurrent cron execution
const cronLocks = {
    morning: false,
    evening: false,
    reset: false,
    vacationActivate: false,
    vacationReset: false,
};

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
// 1. Activate vacation mode – 11:50 PM (moved to avoid conflict with evening delivery)
cron.schedule('50 23 * * *', async () => {
    const now = moment().tz("Asia/Kolkata");
    const today = now.format("YYYY-MM-DD");
    const timestamp = now.format("YYYY-MM-DD HH:mm:ss");
    
    console.log(`[CRON] 🏖️  Vacation Activation started at ${timestamp} IST`);
    
    try {
        const vacations = await Vacation.findAll({ where: { vacation_start: today } });
        console.log(`[CRON] Found ${vacations.length} vacations starting today`);

        let successCount = 0;
        let errorCount = 0;

        for (const vac of vacations) {
            try {
            const user = await User.findByPk(vac.user_id);
                if (!user) {
                    console.log(`[CRON] ⚠️  User ${vac.user_id} not found for vacation ${vac.vacation_id}`);
                    errorCount++;
                    continue;
                }

            if (vac.shift === 'morning' || vac.shift === 'both') {
                user.vacation_mode_morning = true;
            }
            if (vac.shift === 'evening' || vac.shift === 'both') {
                user.vacation_mode_evening = true;
            }

            await user.save();
                successCount++;
                console.log(`[CRON] ✅ Activated vacation mode for user ${user.id} (${user.name}): ${vac.shift}`);
            } catch (userError) {
                errorCount++;
                console.error(`[CRON] ❌ Error activating vacation for user ${vac.user_id}:`, userError.message);
            }
        }

        console.log(`[CRON] 🏖️  Vacation Activation completed: ${successCount} successful, ${errorCount} errors`);
    } catch (err) {
        console.error(`[CRON] ❌ Error activating vacation mode:`, err.message);
        console.error(err.stack);
    }
});

// 2. Reset delivery flags – 11:45 PM
cron.schedule('45 23 * * *', async () => {
    const now = moment().tz("Asia/Kolkata");
    const today = now.format("YYYY-MM-DD");
    const timestamp = now.format("YYYY-MM-DD HH:mm:ss");
    
    console.log(`[CRON] 🔄 Delivery Flags Reset started at ${timestamp} IST`);
    
    try {
        // Step 1: Get all users who should have deliveries today
        // (approved users, not on vacation, with start_date <= today)
        const eligibleUsers = await User.findAll({
            where: {
                request: true,
                start_date: { [Op.lte]: today },
            },
            attributes: ['id', 'name', 'shift', 'vacation_mode_morning', 'vacation_mode_evening', 'delivered_morning', 'delivered_evening'],
        });

        // Step 2: Get all delivery status records for today
        const todayDeliveryStatus = await DeliveryStatus.findAll({
            where: {
                date: today,
            },
            attributes: ['userid', 'shift', 'status'],
        });

        // Create a map of users who have delivery status records
        const usersWithStatus = new Set();
        const notPresentUsers = new Set(); // Track "Not Present" users

        todayDeliveryStatus.forEach(delivery => {
            const key = `${delivery.userid}_${delivery.shift}`;
            usersWithStatus.add(key);
            if (delivery.status === false) {
                // "Not Present" - keep as false (don't auto-deliver)
                notPresentUsers.add(key);
            }
        });

        // Step 3: Find users with NO delivery status record (not marked as anything)
        // These should be auto-marked as delivered
        let morningAutoDelivered = 0;
        let eveningAutoDelivered = 0;
        let notPresentKeptAsFalse = 0;

        for (const user of eligibleUsers) {
            // Check morning shift
            if ((user.shift === 'morning' || user.shift === 'both') && !user.vacation_mode_morning) {
                const morningKey = `${user.id}_morning`;
                
                if (notPresentUsers.has(morningKey)) {
                    // "Not Present" - keep as false (don't change)
                    notPresentKeptAsFalse++;
                    console.log(`[CRON] ⚠️  User ${user.id} (${user.name}) - Morning: "Not Present", keeping delivered_morning: false`);
                } else if (!usersWithStatus.has(morningKey)) {
                    // No delivery status record - auto-mark as delivered
                    await User.update(
                        { delivered_morning: true },
                        { where: { id: user.id } }
                    );
                    morningAutoDelivered++;
                    console.log(`[CRON] ✅ User ${user.id} (${user.name}) - Morning: No status record, auto-marked as delivered`);
                }
            }

            // Check evening shift
            if ((user.shift === 'evening' || user.shift === 'both') && !user.vacation_mode_evening) {
                const eveningKey = `${user.id}_evening`;
                
                if (notPresentUsers.has(eveningKey)) {
                    // "Not Present" - keep as false (don't change)
                    notPresentKeptAsFalse++;
                    console.log(`[CRON] ⚠️  User ${user.id} (${user.name}) - Evening: "Not Present", keeping delivered_evening: false`);
                } else if (!usersWithStatus.has(eveningKey)) {
                    // No delivery status record - auto-mark as delivered
                    await User.update(
                        { delivered_evening: true },
                        { where: { id: user.id } }
                    );
                    eveningAutoDelivered++;
                    console.log(`[CRON] ✅ User ${user.id} (${user.name}) - Evening: No status record, auto-marked as delivered`);
                }
            }
        }

        console.log(`[CRON] 📊 Summary:`);
        console.log(`   ✅ Auto-delivered (no status): ${morningAutoDelivered} morning, ${eveningAutoDelivered} evening`);
        console.log(`   ⚠️  Kept as false (Not Present): ${notPresentKeptAsFalse} records`);

        // Step 4: Reset all delivery flags to false for the next day
        const result = await User.update(
            { delivered_morning: false, delivered_evening: false },
            { where: {} }
        );
        console.log(`[CRON] ✅ Delivery flags reset for ${result[0]} users at 11:45 PM (ready for next day)`);
    } catch (err) {
        console.error(`[CRON] ❌ Error resetting delivery flags:`, err.message);
        console.error(err.stack);
    }
});

// 3. Reset vacation mode – 11:59 PM (just before midnight)
cron.schedule('59 23 * * *', async () => {
    const now = moment().tz("Asia/Kolkata");
    const yesterday = now.clone().subtract(1, 'days');
    const targetDate = yesterday.format("YYYY-MM-DD");
    const timestamp = now.format("YYYY-MM-DD HH:mm:ss");
    
    console.log(`[CRON] 🏖️  Vacation Reset started at ${timestamp} IST (checking vacations ending on ${targetDate})`);

    try {
        const vacations = await Vacation.findAll({ where: { vacation_end: targetDate } });
        console.log(`[CRON] Found ${vacations.length} vacations ending yesterday`);

        let successCount = 0;
        let errorCount = 0;

        for (const vac of vacations) {
            try {
            const user = await User.findByPk(vac.user_id);
                if (!user) {
                    console.log(`[CRON] ⚠️  User ${vac.user_id} not found for vacation ${vac.vacation_id}`);
                    errorCount++;
                    continue;
                }

            if (vac.shift === 'morning' || vac.shift === 'both') {
                user.vacation_mode_morning = false;
            }
            if (vac.shift === 'evening' || vac.shift === 'both') {
                user.vacation_mode_evening = false;
            }

            await user.save();
                successCount++;
                console.log(`[CRON] ✅ Reset vacation mode for user ${user.id} (${user.name}): ${vac.shift}`);
            } catch (userError) {
                errorCount++;
                console.error(`[CRON] ❌ Error resetting vacation for user ${vac.user_id}:`, userError.message);
            }
        }

        console.log(`[CRON] 🏖️  Vacation Reset completed: ${successCount} successful, ${errorCount} errors`);
    } catch (err) {
        console.error(`[CRON] ❌ Error resetting vacation mode:`, err.message);
        console.error(err.stack);
    }
});

// module.exports = calculateMonthlyPayments;

// ⏰ Schedule: Runs daily at 2:01 PM IST
cron.schedule("01 14 * * *", async () => {
    // Prevent concurrent execution
    if (cronLocks.morning) {
        console.log(`[CRON] ⚠️  Morning cron is already running, skipping this execution`);
        return;
    }

    cronLocks.morning = true;
        const now = moment().tz("Asia/Kolkata");
        const today = now.format("YYYY-MM-DD");
    const timestamp = now.format("YYYY-MM-DD HH:mm:ss");

    console.log(`[CRON] 🌅 Morning Auto-Delivery started at ${timestamp} IST`);

    try {
        // 1️⃣ Fetch users who haven't been delivered in the morning
        const pendingUsers = await User.findAll({
            where: {
                request: true,
                vacation_mode_morning: false,
                delivered_morning: false,
                start_date: { [Op.lte]: today },
            },
        });

        console.log(`[CRON] Found ${pendingUsers.length} pending morning users`);

        let successCount = 0;
        let errorCount = 0;

        for (const user of pendingUsers) {
            try {
                // Check if delivery already exists (prevent duplicates)
                const existingDelivery = await DeliveryStatus.findOne({
                    where: {
                        userid: user.id,
                        shift: "morning",
                        date: today,
                    },
                });

                if (existingDelivery) {
                    console.log(`[CRON] ⚠️  Delivery already exists for user ${user.id} (${user.name}), skipping`);
                    // Only mark delivered if status is true; keep false if Not Present
                    if (existingDelivery.status === true) {
                        await User.update(
                            { delivered_morning: true },
                            { where: { id: user.id } }
                        );
                    }
                    continue;
                }

                // Validate user data
                if (!user.milk_type || !user.quantity || Number(user.quantity) <= 0) {
                    console.log(`[CRON] ⚠️  Invalid user data for user ${user.id} (${user.name}): milk_type=${user.milk_type}, quantity=${user.quantity}`);
                    errorCount++;
                    continue;
                }

                // NOTE: quantity_array format is [pure, cow, buffalo]
                let quantityArray;
            if (user.milk_type == "buffalo") {
                    quantityArray = [0, 0, Number(user.quantity) || 0];
                }
                else if (user.milk_type == "cow") {
                quantityArray = [0, Number(user.quantity) || 0, 0];
            }
                else if (user.milk_type == "pure") {
                quantityArray = [Number(user.quantity) || 0, 0, 0];
            }
                else {
                    console.log(`[CRON] ⚠️  Unknown milk_type for user ${user.id} (${user.name}): ${user.milk_type}`);
                    errorCount++;
                    continue;
                }

                // Validate quantity array
                if (!Array.isArray(quantityArray) || quantityArray.length !== 3) {
                    console.log(`[CRON] ⚠️  Invalid quantity array for user ${user.id} (${user.name})`);
                    errorCount++;
                    continue;
                }

                // Use transaction to ensure data consistency
                const sequelize = User.sequelize;
                const transaction = await sequelize.transaction();

                try {
            // Insert into DeliveryStatus
            await DeliveryStatus.create({
                userid: user.id,
                quantity_array: JSON.stringify(quantityArray),
                shift: "morning",
                status: true,
                date: today,
                    }, { transaction });

            // Mark user as delivered
            await User.update(
                { delivered_morning: true },
                        { where: { id: user.id }, transaction }
            );

                    await transaction.commit();
                    successCount++;
                    console.log(`[CRON] ✅ Auto-delivered morning milk for user ${user.id} (${user.name}): ${user.quantity}L ${user.milk_type}`);
                } catch (transactionError) {
                    await transaction.rollback();
                    throw transactionError;
                }
            } catch (userError) {
                errorCount++;
                console.error(`[CRON] ❌ Error processing user ${user.id} (${user.name}):`, userError.message);
                // Continue with next user instead of stopping
            }
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

        console.log(`[CRON] Found ${additionalOrders.length} additional morning orders`);

        for (const order of additionalOrders) {
            try {
            const user = order.user;
                if (!user) {
                    console.log(`[CRON] ⚠️  Additional order ${order.additinalOrder_id} has no user, skipping`);
                    continue;
                }

                // Check if delivery already exists
                const existingDelivery = await DeliveryStatus.findOne({
                    where: {
                        userid: user.id,
                        shift: "morning",
                        date: today,
                    },
                });

                if (existingDelivery) {
                    console.log(`[CRON] ⚠️  Delivery already exists for additional order ${order.additinalOrder_id}, skipping`);
                    await AdditionalOrder.update(
                        { status: true },
                        { where: { additinalOrder_id: order.additinalOrder_id } }
                    );
                    continue;
                }

            const quantityArray = order.quantity_array;
                if (!quantityArray || !Array.isArray(quantityArray)) {
                    console.log(`[CRON] ⚠️  Invalid quantity_array for additional order ${order.additinalOrder_id}`);
                    continue;
                }

                const sequelize = User.sequelize;
                const transaction = await sequelize.transaction();

                try {
            await DeliveryStatus.create({
                userid: user.id,
                        quantity_array: Array.isArray(quantityArray) ? JSON.stringify(quantityArray) : quantityArray,
                shift: "morning",
                status: true,
                date: today,
                    }, { transaction });

            await AdditionalOrder.update(
                { status: true },
                        { where: { additinalOrder_id: order.additinalOrder_id }, transaction }
            );

            await User.update(
                { delivered_morning: true },
                        { where: { id: user.id }, transaction }
                    );

                    await transaction.commit();
                    successCount++;
                    console.log(`[CRON] ✅ Processed additional morning order ${order.additinalOrder_id} for user ${user.id}`);
                } catch (transactionError) {
                    await transaction.rollback();
                    throw transactionError;
                }
            } catch (orderError) {
                errorCount++;
                console.error(`[CRON] ❌ Error processing additional order ${order.additinalOrder_id}:`, orderError.message);
            }
        }

        console.log(`[CRON] 🌅 Morning Auto-Delivery completed: ${successCount} successful, ${errorCount} errors`);
    } catch (error) {
        console.error(`[CRON] ❌ Morning Cron Error:`, error.message);
        console.error(error.stack);
    } finally {
        cronLocks.morning = false;
    }
});

// ⏰ Schedule: Runs daily at 11:30 PM IST - Auto-update evening deliveries
cron.schedule("30 23 * * *", async () => {
    // Prevent concurrent execution
    if (cronLocks.evening) {
        console.log(`[CRON] ⚠️  Evening cron is already running, skipping this execution`);
        return;
    }

    cronLocks.evening = true;
    const now = moment().tz("Asia/Kolkata");
    const today = now.format("YYYY-MM-DD");
    const timestamp = now.format("YYYY-MM-DD HH:mm:ss");
    
    console.log(`[CRON] 🌆 Evening Auto-Delivery started at ${timestamp} IST`);

    try {
        // 1️⃣ Fetch users who haven't been delivered in the evening
        const pendingUsers = await User.findAll({
            where: {
                request: true,
                vacation_mode_evening: false,
                delivered_evening: false,
                start_date: { [Op.lte]: today },
            },
        });

        console.log(`[CRON] Found ${pendingUsers.length} pending evening users`);

        let successCount = 0;
        let errorCount = 0;

        for (const user of pendingUsers) {
            try {
                // Check if delivery already exists (prevent duplicates)
                const existingDelivery = await DeliveryStatus.findOne({
                    where: {
                        userid: user.id,
                        shift: "evening",
                        date: today,
                    },
                });

                if (existingDelivery) {
                    console.log(`[CRON] ⚠️  Delivery already exists for user ${user.id} (${user.name}), skipping`);
                    // Only mark delivered if status is true; keep false if Not Present
                    if (existingDelivery.status === true) {
                        await User.update(
                            { delivered_evening: true },
                            { where: { id: user.id } }
                        );
                    }
                    continue;
        }

                // Validate user data
                if (!user.milk_type || !user.quantity || Number(user.quantity) <= 0) {
                    console.log(`[CRON] ⚠️  Invalid user data for user ${user.id} (${user.name}): milk_type=${user.milk_type}, quantity=${user.quantity}`);
                    errorCount++;
                    continue;
                }

                let quantityArray;
                // NOTE: quantity_array format is [pure, cow, buffalo]
                if (user.milk_type == "buffalo") {
                    quantityArray = [0, 0, Number(user.quantity) || 0];
                }
                else if (user.milk_type == "cow") {
                    quantityArray = [0, Number(user.quantity) || 0, 0];
                }
                else if (user.milk_type == "pure") {
                    quantityArray = [Number(user.quantity) || 0, 0, 0];
                }
                else {
                    console.log(`[CRON] ⚠️  Unknown milk_type for user ${user.id} (${user.name}): ${user.milk_type}`);
                    errorCount++;
                    continue;
                }

                // Validate quantity array
                if (!Array.isArray(quantityArray) || quantityArray.length !== 3) {
                    console.log(`[CRON] ⚠️  Invalid quantity array for user ${user.id} (${user.name})`);
                    errorCount++;
                    continue;
                }

                // Use transaction to ensure data consistency
                const sequelize = User.sequelize;
                const transaction = await sequelize.transaction();

                try {
                    // Insert into DeliveryStatus
                    await DeliveryStatus.create({
                        userid: user.id,
                        quantity_array: JSON.stringify(quantityArray),
                        shift: "evening",
                        status: true,
                        date: today,
                    }, { transaction });

                    // Mark user as delivered
                    await User.update(
                        { delivered_evening: true },
                        { where: { id: user.id }, transaction }
                    );

                    await transaction.commit();
                    successCount++;
                    console.log(`[CRON] ✅ Auto-delivered evening milk for user ${user.id} (${user.name}): ${user.quantity}L ${user.milk_type}`);
                } catch (transactionError) {
                    await transaction.rollback();
                    throw transactionError;
                }
            } catch (userError) {
                errorCount++;
                console.error(`[CRON] ❌ Error processing user ${user.id} (${user.name}):`, userError.message);
                // Continue with next user instead of stopping
            }
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

        console.log(`[CRON] Found ${additionalOrders.length} additional evening orders`);

        for (const order of additionalOrders) {
            try {
                const user = order.user;
                if (!user) {
                    console.log(`[CRON] ⚠️  Additional order ${order.additinalOrder_id} has no user, skipping`);
                    continue;
                }

                // Check if delivery already exists
                const existingDelivery = await DeliveryStatus.findOne({
                    where: {
                        userid: user.id,
                        shift: "evening",
                        date: today,
                    },
                });

                if (existingDelivery) {
                    console.log(`[CRON] ⚠️  Delivery already exists for additional order ${order.additinalOrder_id}, skipping`);
                    await AdditionalOrder.update(
                        { status: true },
                        { where: { additinalOrder_id: order.additinalOrder_id } }
                    );
                    continue;
                }

                const quantityArray = order.quantity_array;
                if (!quantityArray || !Array.isArray(quantityArray)) {
                    console.log(`[CRON] ⚠️  Invalid quantity_array for additional order ${order.additinalOrder_id}`);
                    continue;
                }

                const sequelize = User.sequelize;
                const transaction = await sequelize.transaction();

                try {
                    await DeliveryStatus.create({
                        userid: user.id,
                        quantity_array: Array.isArray(quantityArray) ? JSON.stringify(quantityArray) : quantityArray,
                        shift: "evening",
                        status: true,
                        date: today,
                    }, { transaction });

                    await AdditionalOrder.update(
                        { status: true },
                        { where: { additinalOrder_id: order.additinalOrder_id }, transaction }
                    );

                    await User.update(
                        { delivered_evening: true },
                        { where: { id: user.id }, transaction }
                    );

                    await transaction.commit();
                    successCount++;
                    console.log(`[CRON] ✅ Processed additional evening order ${order.additinalOrder_id} for user ${user.id}`);
                } catch (transactionError) {
                    await transaction.rollback();
                    throw transactionError;
                }
            } catch (orderError) {
                errorCount++;
                console.error(`[CRON] ❌ Error processing additional order ${order.additinalOrder_id}:`, orderError.message);
            }
        }

        console.log(`[CRON] 🌆 Evening Auto-Delivery completed: ${successCount} successful, ${errorCount} errors`);
    } catch (error) {
        console.error(`[CRON] ❌ Evening Cron Error:`, error.message);
        console.error(error.stack);
    } finally {
        cronLocks.evening = false;
    }
});