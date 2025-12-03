const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();
const upload = require("../middlewares/multer");
const { validateUserRegistration } = require("../validators/uservalidation");
const { isUserLoggedIn } = require("../middlewares/userAuthontication");
const {
  authenticateUser,
  authorizeRole,
} = require("../middlewares/authontication");
const userController = require("../controllers/user");

//  User Registration API
router.post(
  "/register",
  validateUserRegistration,
  userController.registeredUser
);

// 🔹 Create Vacation API
router.post(
  "/vacation",
  authenticateUser,
  isUserLoggedIn,
  authorizeRole(["user"]),
  userController.add_vacation
);

//Api to fetching the rate data

router.get(
  "/getRates",
  authenticateUser,
  authorizeRole(["user"]),
  userController.getRate
);

//Api to fetch dairy info (name and logo)
router.get(
  "/get-dairy-info",
  authenticateUser,
  authorizeRole(["user"]),
  userController.getDairyInfo
);

//Api for payment bill generation of the full month
// router.post("/calculatePayment",authenticateUser,authorizeRole(["user"]),userController.calculateUserPaymentAfterMonth);

//Api for payment, and addvance payment of the month
// router.get("/get-pending-month-payment",authenticateUser,authorizeRole(["user"]),userController.getPendingMonthPayment);

//Api for total pending payment
// router.get("/get-total-pending-payment",authenticateUser,authorizeRole(["user"]),userController.getPendingMonthTotalPayment);

// Get QR Image and UPI Address for users under the same dairy
router.get(
  "/get-payment-details",
  authenticateUser,
  authorizeRole(["user"]),
  userController.getPaymentDetails
);
// Get last month payment details
router.get(
  "/get-payment-summary",
  authenticateUser,
  authorizeRole(["user"]),
  userController.getUserPaymentSummary
);

// Update QR Image
router.put(
  "/update-payment-details",
  authenticateUser,
  isUserLoggedIn,
  authorizeRole(["user"]),
  upload.single("qr_image"),
  userController.updatePaymentDetails
);

//get vacation date
router.get(
  "/getvacation",
  authenticateUser,
  authorizeRole(["user"]),
  userController.getVacationDate
);

//get the delivered ordered
router.get(
  "/deliveredOrders",
  authenticateUser,
  authorizeRole(["user"]),
  userController.getDeliveredOrder
);

// //get the not present orders
// router.get("/notPresentOrders", authenticateUser, authorizeRole(["user"]), userController.getNotPresentOrder);

router.get(
  "/startDate",
  authenticateUser,
  authorizeRole(["user"]),
  userController.startDate
);

// API to get the profile of a particular admin
router.get(
  "/profile/me",
  authenticateUser,
  authorizeRole(["user"]),
  userController.profile
);

//Api to show the Payment proof to the user
router.get(
  "/get-paymentProof",
  authenticateUser,
  authorizeRole(["user"]),
  userController.getPaymentProof
);

router.get(
  "/getAllRates",
  authenticateUser,
  authorizeRole(["user"]),
  userController.getAllRate
);

router.post(
  "/additional_Order",
  authenticateUser,
  isUserLoggedIn,
  authorizeRole(["user"]),
  userController.additinal_order
);

module.exports = router;
