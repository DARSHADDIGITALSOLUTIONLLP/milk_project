const sequelize = require("../config/db.js");

// // Import models
const SuperAdmin = require("./SuperAdmin.js");
const Admin = require("./Admin.js");
const PaymentDetails = require("./payment_details.js");
const user = require("./User.js");
const vactionDate = require("./vacations.js");
const deliveryBoy = require("./DeliveryBoy.js");
const deliveryStatus = require("./DeliveryStatus.js");
const additinalOrder = require("./additinalOrder.js");
const Farmer = require("./Farmer.js");
const DailyFarmerOrder = require("./DailyFarmerOrder.js");
const FarmerPayment = require("./FarmerPayment.js");

// Sync all models (create tables if not exist)
async function syncModels() {
  try {
    await sequelize.sync();
    console.log("All models synced successfully");
    process.exit();
  } catch (error) {
    console.error("Error syncing models:", error);
    process.exit(1);
  }
}

syncModels();

module.exports = { 
  sequelize, 
  SuperAdmin, 
  Admin,
  vactionDate,
  deliveryStatus,
  deliveryBoy,
  user,
  PaymentDetails,
  additinalOrder,
  Farmer,
  DailyFarmerOrder,
  FarmerPayment,
  syncModels
};
