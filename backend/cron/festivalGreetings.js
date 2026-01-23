/**
 * Festival Greetings Cron Job
 * Sends festival greeting notifications to CUSTOMERS ONLY (User model)
 * Does NOT send to Admin, SuperAdmin, or DeliveryBoy
 * Runs daily at 9:00 AM IST to send greetings for the day
 */

const cron = require("node-cron");
const moment = require("moment-timezone");
const { getFestivalForDate } = require("../utils/festivals");
const User = require("../models/User");
const admin = require("../utils/firebase");

// Lock to prevent concurrent execution
let isRunning = false;

/**
 * Send festival greeting notification to a user
 * @param {Object} user - User object with fcm_token
 * @param {Object} festival - Festival object with name and greeting
 */
async function sendFestivalGreeting(user, festival) {
    try {
        if (!user.fcm_token) {
            // User doesn't have FCM token, skip silently
            return { success: false, reason: "no_token" };
        }

        // Handle multiple tokens (comma-separated)
        const fcmTokens = user.fcm_token.split(",").map(token => token.trim()).filter(token => token.length > 0);

        if (fcmTokens.length === 0) {
            return { success: false, reason: "no_valid_tokens" };
        }

        const message = {
            notification: {
                title: `🎉 ${festival.name} Greetings!`,
                body: festival.greeting,
                image: '/notification.png', // You can use a festival-specific image if available
            },
            data: {
                type: "festival_greeting",
                festival_name: festival.name,
                redirect_url: "/", // Redirect to home page when clicked
            },
            tokens: fcmTokens,
        };

        const response = await admin.messaging().sendEachForMulticast(message);

        // Log results
        if (response.successCount > 0) {
            console.log(`✅ Festival greeting sent to user ${user.id} (${user.name}): ${response.successCount} token(s) successful`);
        }
        if (response.failureCount > 0) {
            console.log(`⚠️  Festival greeting failed for user ${user.id} (${user.name}): ${response.failureCount} token(s) failed`);
            // Optionally remove invalid tokens
            response.responses.forEach((resp, idx) => {
                if (!resp.success && resp.error) {
                    console.log(`   Error for token ${idx}: ${resp.error.code} - ${resp.error.message}`);
                }
            });
        }

        return { 
            success: response.successCount > 0, 
            successCount: response.successCount,
            failureCount: response.failureCount 
        };
    } catch (error) {
        console.error(`❌ Error sending festival greeting to user ${user.id}:`, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Main function to check and send festival greetings
 */
async function checkAndSendFestivalGreetings() {
    // Prevent concurrent execution
    if (isRunning) {
        console.log(`[FESTIVAL CRON] ⚠️  Previous execution still running, skipping this run`);
        return;
    }

    isRunning = true;
    const now = moment.tz("Asia/Kolkata");
    const today = now.format("YYYY-MM-DD");
    const timestamp = now.format("YYYY-MM-DD HH:mm:ss");

    console.log(`[FESTIVAL CRON] 🎉 Festival Greetings Check started at ${timestamp} IST`);

    try {
        // Check if today is a festival
        const festival = getFestivalForDate(today);

        if (!festival) {
            console.log(`[FESTIVAL CRON] ℹ️  No festival today (${today}), skipping greetings`);
            return;
        }

        console.log(`[FESTIVAL CRON] 🎊 Today is ${festival.name}! Sending greetings to all active CUSTOMERS ONLY...`);

        // Fetch all active customers (approved users) - CUSTOMERS ONLY, NOT admins
        // User model represents customers, not admins
        const activeUsers = await User.findAll({
            where: {
                request: true, // Only approved customers
            },
            attributes: ['id', 'name', 'email', 'fcm_token'],
        });

        console.log(`[FESTIVAL CRON] Found ${activeUsers.length} active customers`);

        if (activeUsers.length === 0) {
            console.log(`[FESTIVAL CRON] ℹ️  No active customers found, skipping`);
            return;
        }

        let successCount = 0;
        let failureCount = 0;
        let skippedCount = 0;

        // Send greetings to all active users
        for (const user of activeUsers) {
            const result = await sendFestivalGreeting(user, festival);
            
            if (result.success) {
                successCount++;
            } else if (result.reason === "no_token" || result.reason === "no_valid_tokens") {
                skippedCount++;
            } else {
                failureCount++;
            }
        }

        console.log(`[FESTIVAL CRON] ✅ Festival Greetings completed:`);
        console.log(`   - Successful: ${successCount}`);
        console.log(`   - Failed: ${failureCount}`);
        console.log(`   - Skipped (no token): ${skippedCount}`);
        console.log(`   - Total: ${activeUsers.length}`);

    } catch (error) {
        console.error(`[FESTIVAL CRON] ❌ Error in festival greetings cron:`, error.message);
        console.error(error.stack);
    } finally {
        isRunning = false;
    }
}

// Schedule: Run daily at 9:00 AM IST
// Cron format: minute hour day month day-of-week
// "0 9 * * *" = 9:00 AM every day
cron.schedule("0 9 * * *", async () => {
    await checkAndSendFestivalGreetings();
});

// Also run on server start for testing (optional - remove in production if not needed)
// Uncomment the line below if you want to test immediately on server start
// checkAndSendFestivalGreetings();

console.log("✅ Festival Greetings Cron Job scheduled: Daily at 9:00 AM IST");

module.exports = {
    checkAndSendFestivalGreetings,
    sendFestivalGreeting
};
