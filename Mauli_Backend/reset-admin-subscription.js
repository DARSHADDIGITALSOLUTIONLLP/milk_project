const Admin = require("./models/Admin.js");
const sequelize = require("./config/db.js");
require("dotenv").config();

/**
 * Reset admin subscription
 * Usage:
 *   node reset-admin-subscription.js                    - Reset all admins
 *   node reset-admin-subscription.js --id=1             - Reset admin by ID
 *   node reset-admin-subscription.js --email=admin@example.com  - Reset admin by email
 */
async function resetAdminSubscription() {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log("✅ Database connected successfully.");

    // Parse command line arguments
    const args = process.argv.slice(2);
    let adminId = null;
    let adminEmail = null;

    args.forEach((arg) => {
      if (arg.startsWith("--id=")) {
        adminId = parseInt(arg.split("=")[1]);
      } else if (arg.startsWith("--email=")) {
        adminEmail = arg.split("=")[1];
      }
    });

    let admins = [];

    // Find admin(s) based on arguments
    if (adminId) {
      const admin = await Admin.findByPk(adminId);
      if (!admin) {
        console.error(`❌ Admin with ID ${adminId} not found.`);
        process.exit(1);
      }
      admins = [admin];
      console.log(`📋 Found admin: ${admin.dairy_name} (ID: ${admin.id}, Email: ${admin.email})`);
    } else if (adminEmail) {
      const admin = await Admin.findOne({ where: { email: adminEmail } });
      if (!admin) {
        console.error(`❌ Admin with email ${adminEmail} not found.`);
        process.exit(1);
      }
      admins = [admin];
      console.log(`📋 Found admin: ${admin.dairy_name} (ID: ${admin.id}, Email: ${admin.email})`);
    } else {
      // Reset all admins
      admins = await Admin.findAll();
      console.log(`📋 Found ${admins.length} admin(s) to reset.`);
    }

    if (admins.length === 0) {
      console.log("ℹ️  No admins found to reset.");
      process.exit(0);
    }

    // Reset each admin's subscription
    let successCount = 0;
    let errorCount = 0;

    for (const admin of admins) {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of day

        // Set res_date to today
        admin.res_date = today;

        // Calculate new end_date based on existing period
        if (admin.periods) {
          let end_date = new Date(today);
          switch (admin.periods) {
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
              console.warn(`⚠️  Unknown period "${admin.periods}" for admin ${admin.dairy_name}. Skipping end_date calculation.`);
              end_date = null;
          }
          
          if (end_date) {
            end_date.setHours(0, 0, 0, 0);
            admin.end_date = end_date;
          }
        } else {
          console.warn(`⚠️  No period set for admin ${admin.dairy_name}. End date will not be updated.`);
        }

        // Save the changes
        await admin.save();

        console.log(`✅ Reset subscription for: ${admin.dairy_name}`);
        console.log(`   - New res_date: ${admin.res_date.toISOString().split("T")[0]}`);
        if (admin.end_date) {
          console.log(`   - New end_date: ${admin.end_date.toISOString().split("T")[0]}`);
        }
        console.log(`   - Period: ${admin.periods || "N/A"}`);
        
        successCount++;
      } catch (error) {
        console.error(`❌ Error resetting subscription for ${admin.dairy_name}:`, error.message);
        errorCount++;
      }
    }

    console.log("\n📊 Summary:");
    console.log(`   ✅ Successfully reset: ${successCount} admin(s)`);
    if (errorCount > 0) {
      console.log(`   ❌ Errors: ${errorCount} admin(s)`);
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
resetAdminSubscription();

