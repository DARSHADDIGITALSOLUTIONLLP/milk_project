// Script to get all login credentials from database
require("dotenv").config();
const db = require("./config/db.js");

async function getCredentials() {
    try {
        console.log("\n🔍 Fetching all login credentials from database...\n");
        
        // Get SuperAdmin
        const [superAdmins] = await db.query("SELECT id, email, contact FROM super_admin");
        console.log("═══════════════════════════════════════════════════════");
        console.log("👑 SUPER ADMIN CREDENTIALS");
        console.log("═══════════════════════════════════════════════════════");
        superAdmins.forEach(admin => {
            console.log(`ID: ${admin.id}`);
            console.log(`Email: ${admin.email}`);
            console.log(`Contact: ${admin.contact}`);
            console.log(`Password: (Hashed - Use: '123456' or 'password' as default)`);
            console.log("───────────────────────────────────────────────────");
        });

        // Get Admin
        const [admins] = await db.query("SELECT id, dairy_name, email, contact, request FROM admin_registration");
        console.log("\n═══════════════════════════════════════════════════════");
        console.log("🏢 ADMIN CREDENTIALS");
        console.log("═══════════════════════════════════════════════════════");
        admins.forEach(admin => {
            console.log(`ID: ${admin.id}`);
            console.log(`Dairy Name: ${admin.dairy_name}`);
            console.log(`Email: ${admin.email}`);
            console.log(`Contact: ${admin.contact}`);
            console.log(`Status: ${admin.request ? '✅ Approved' : '❌ Pending'}`);
            console.log(`Password: (Hashed - Use: '123456' or 'password' as default)`);
            console.log("───────────────────────────────────────────────────");
        });

        // Get Users
        const [users] = await db.query("SELECT id, name, email, contact, dairy_name, request FROM users");
        console.log("\n═══════════════════════════════════════════════════════");
        console.log("👤 USER (CUSTOMER) CREDENTIALS");
        console.log("═══════════════════════════════════════════════════════");
        users.forEach(user => {
            console.log(`ID: ${user.id}`);
            console.log(`Name: ${user.name}`);
            console.log(`Email: ${user.email}`);
            console.log(`Contact: ${user.contact}`);
            console.log(`Dairy: ${user.dairy_name}`);
            console.log(`Status: ${user.request ? '✅ Approved' : '❌ Pending'}`);
            console.log(`Password: (Hashed - Use: '123456' or 'password' as default)`);
            console.log("───────────────────────────────────────────────────");
        });

        // Get Delivery Boys
        const [deliveryBoys] = await db.query("SELECT id, name, email, contact, dairy_name FROM delivery_boys");
        console.log("\n═══════════════════════════════════════════════════════");
        console.log("🚚 DELIVERY BOY CREDENTIALS");
        console.log("═══════════════════════════════════════════════════════");
        deliveryBoys.forEach(db => {
            console.log(`ID: ${db.id}`);
            console.log(`Name: ${db.name}`);
            console.log(`Email: ${db.email}`);
            console.log(`Contact: ${db.contact}`);
            console.log(`Dairy: ${db.dairy_name}`);
            console.log(`Password: (Hashed - Use: '123456' or 'password' as default)`);
            console.log("───────────────────────────────────────────────────");
        });

        // Get Farmers
        const [farmers] = await db.query("SELECT id, full_name, email, contact, dairy_name, status FROM farmers LIMIT 10");
        console.log("\n═══════════════════════════════════════════════════════");
        console.log("🐄 FARMER CREDENTIALS (First 10)");
        console.log("═══════════════════════════════════════════════════════");
        farmers.forEach(farmer => {
            console.log(`ID: ${farmer.id}`);
            console.log(`Name: ${farmer.full_name}`);
            console.log(`Email: ${farmer.email}`);
            console.log(`Contact: ${farmer.contact}`);
            console.log(`Dairy: ${farmer.dairy_name}`);
            console.log(`Status: ${farmer.status ? '✅ Active' : '❌ Inactive'}`);
            console.log(`Password: (Hashed - Use: '123456' or 'password' as default)`);
            console.log("───────────────────────────────────────────────────");
        });

        console.log("\n✅ Credentials fetched successfully!");
        console.log("\n💡 NOTE: Passwords are hashed. Common default passwords:");
        console.log("   - '123456'");
        console.log("   - 'password'");
        console.log("   - 'admin123'");
        console.log("\n📝 You can login using Email OR Contact number\n");
        
        process.exit(0);
    } catch (error) {
        console.error("\n❌ Error fetching credentials:", error.message);
        process.exit(1);
    }
}

getCredentials();

