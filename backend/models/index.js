const sequelize = require("../config/db.js");

// // Import models
const SuperAdmin = require("./SuperAdmin.js");
const Admin = require("./Admin.js");
const PaymentDetails = require("./payment_details.js");
const user = require("./User.js");
const vactionDate = require("./vacations.js");
const deliveryBoy = require("./DeliveryBoy.js");
const deliveryStatus = require("./deliveryStatus.js");
const additinalOrder = require("./additinalOrder.js");
const Farmer = require("./Farmer.js");
const DailyFarmerOrder = require("./DailyFarmerOrder.js");
const FarmerPayment = require("./FarmerPayment.js");

// // Sync all models (create tables if not exist)
const syncModels = async () => {
    try {
        await sequelize.sync({ alter: true }); // `alter: true` updates schema without deleting data
        console.log("All tables created (if not exist)");
    } catch (error) {
        console.error("Error creating tables:", error);
    }
};

// module.exports = { sequelize, SuperAdmin, Admin,vactionDate,deliveryStatus,deliveryBoy,user,PaymentDetails, syncModels };
module.exports = { sequelize, Admin, syncModels };
