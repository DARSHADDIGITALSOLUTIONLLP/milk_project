const express = require("express");
const { authenticateUser, authorizeRole } = require("../middlewares/authontication");
const farmerController = require("../controllers/farmer")

const router = express.Router();
router.get("/todays_order", authenticateUser, authorizeRole(["farmer"]), farmerController.getFarmerTodaysOrder);

//api for the payment history
router.get("/payment_history", authenticateUser, authorizeRole(["farmer"]), farmerController.getFarmerPaymentHistory);

//api for fetching the one month ordr history
router.get("/orderhistory", authenticateUser, authorizeRole(["farmer"]), farmerController.getallMyDailyOrderHistory);

module.exports = router;

