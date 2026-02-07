const express = require("express");
const { authenticateUser, authorizeRole } = require("../middlewares/authontication");
const farmerController = require("../controllers/farmer");
const upload = require("../middlewares/multer");

const router = express.Router();

router.get("/todays_order", authenticateUser, authorizeRole(["farmer"]), farmerController.getFarmerTodaysOrder);

// API for the payment history
router.get("/payment_history", authenticateUser, authorizeRole(["farmer"]), farmerController.getFarmerPaymentHistory);

// API for fetching the last month order history
router.get("/orderhistory", authenticateUser, authorizeRole(["farmer"]), farmerController.getallMyDailyOrderHistory);

// Get Farmer Payment Details (UPI / Bank / QR) for profile dropdown
router.get(
  "/get-payment-details",
  authenticateUser,
  authorizeRole(["farmer"]),
  farmerController.getPaymentDetails
);

// Update Farmer Payment Details (UPI / Bank / QR) from profile dropdown
router.put(
  "/update-payment-details",
  authenticateUser,
  authorizeRole(["farmer"]),
  upload.single("qr_image"),
  farmerController.updatePaymentDetails
);

module.exports = router;

