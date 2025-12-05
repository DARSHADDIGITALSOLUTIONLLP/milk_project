/**
 * Script to add demo milk distribution data for yesterday
 * Run this with: node add-demo-milk-distribution.js
 */

require("dotenv").config();
const moment = require("moment-timezone");
const db = require("./config/db");
const DeliveryBoy = require("./models/DeliveryBoy");
const DeliveryBoyMilkDistribution = require("./models/DeliveryBoyMilkDistribution");

async function addDemoMilkDistribution() {
  try {
    await db.authenticate();
    console.log("✅ Database connected successfully");

    // Get yesterday's date in Asia/Kolkata timezone
    const yesterday = moment().tz("Asia/Kolkata").subtract(1, "days").format("YYYY-MM-DD");
    console.log(`📅 Adding demo data for: ${yesterday}`);

    // Get all delivery boys
    const deliveryBoys = await DeliveryBoy.findAll({
      attributes: ["id", "name", "email", "dairy_name"],
      limit: 10, // Limit to 10 for demo
    });

    if (deliveryBoys.length === 0) {
      console.log("⚠️  No delivery boys found in the database");
      return;
    }

    console.log(`\n📋 Found ${deliveryBoys.length} delivery boys`);
    console.log("   Adding demo milk distribution...\n");

    let addedCount = 0;
    let updatedCount = 0;

    for (const dboy of deliveryBoys) {
      // Generate random demo quantities
      const pureQty = parseFloat((Math.random() * 10 + 5).toFixed(2)); // 5-15 liters
      const cowQty = parseFloat((Math.random() * 20 + 10).toFixed(2)); // 10-30 liters
      const buffaloQty = parseFloat((Math.random() * 15 + 8).toFixed(2)); // 8-23 liters

      // Find or create distribution record
      const [distribution, created] = await DeliveryBoyMilkDistribution.findOrCreate({
        where: {
          delivery_boy_id: dboy.id,
          date: yesterday,
        },
        defaults: {
          delivery_boy_id: dboy.id,
          date: yesterday,
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
        updatedCount++;
        console.log(`   ✅ Updated: ${dboy.name} - Pure: ${pureQty}L, Cow: ${cowQty}L, Buffalo: ${buffaloQty}L`);
      } else {
        addedCount++;
        console.log(`   ✅ Added: ${dboy.name} - Pure: ${pureQty}L, Cow: ${cowQty}L, Buffalo: ${buffaloQty}L`);
      }
    }

    console.log(`\n✅ Demo data added successfully!`);
    console.log(`   Added: ${addedCount} records`);
    console.log(`   Updated: ${updatedCount} records`);
    console.log(`   Date: ${yesterday}\n`);

    // Verify the data
    const verifyData = await DeliveryBoyMilkDistribution.findAll({
      where: { date: yesterday },
      include: [
        {
          model: DeliveryBoy,
          as: "deliveryBoy",
          attributes: ["name", "email"],
        },
      ],
    });

    console.log("📊 Verification - Yesterday's milk distribution:");
    console.log("=" .repeat(70));
    verifyData.forEach((dist) => {
      const total = parseFloat(dist.pure_quantity) + parseFloat(dist.cow_quantity) + parseFloat(dist.buffalo_quantity);
      console.log(
        `   ${dist.deliveryBoy.name.padEnd(20)} | Pure: ${String(dist.pure_quantity).padStart(6)}L | Cow: ${String(dist.cow_quantity).padStart(6)}L | Buffalo: ${String(dist.buffalo_quantity).padStart(6)}L | Total: ${total.toFixed(2)}L`
      );
    });
    console.log("=" .repeat(70));

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
addDemoMilkDistribution();

