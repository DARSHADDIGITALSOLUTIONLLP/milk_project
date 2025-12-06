const express = require("express");
const moment = require("moment");
const { Op } = require("sequelize");
const upload = require("../middlewares/multer");
const {
  authenticateUser,
  authorizeRole,
} = require("../middlewares/authontication");
const { isAdminLoggedIn } = require("../middlewares/adminAuthontication");
const { validateAdminRegistration } = require("../validators/adminValidation");
const { validateUserRegistration } = require("../validators/uservalidation");
const {
  validateFarmerRegistration,
} = require("../validators/farmerValidation");

const adminController = require("../controllers/admin");

const router = express.Router();

router.post(
  "/checkUser",
  validateAdminRegistration,
  adminController.checkAdmin
);

//Use during registration of the dairy
router.post("/usermakepayment", adminController.userDashPay);
router.post("/paymentVerification", adminController.paymentVerification);

//Use when subscription is expired
router.post(
  "/usermakepaymentsubscription",
  adminController.userDashSubscriptionPay
);
router.post(
  "/paymentVerificationSubscription",
  adminController.paymentVerificationSubscription
);

// POST API to add or update rates
router.post(
  "/addRate",
  authenticateUser,
  isAdminLoggedIn,
  authorizeRole(["admin"]),
  adminController.addRate
);

// Update QR Image and UPI Address
router.put(
  "/update-payment-details",
  authenticateUser,
  isAdminLoggedIn,
  authorizeRole(["admin"]),
  upload.single("qr_image"),
  adminController.updatePaymentDetails
);

//get the user
router.get(
  "/users",
  authenticateUser,
  authorizeRole(["admin"]),
  adminController.fetchAllUsers
);

// API: Add User (Only Admin Can Add)
router.post(
  "/add-user",
  authenticateUser,
  isAdminLoggedIn,
  authorizeRole(["admin"]),
  (req, res, next) => {
    req.body.dairy_name = req.user.dairy_name; // Inject dairy_name into request body
    next(); // Proceed to validation
  },
  validateUserRegistration,
  adminController.addNewUser
);

//APi for Pending Request
router.put(
  "/users/:id/request",
  isAdminLoggedIn,
  authenticateUser,
  authorizeRole(["admin"]),
  adminController.updateRequest
);

//Api for pecting the pending request
router.get(
  "/pending-requests",
  authenticateUser,
  authorizeRole(["admin"]),
  adminController.fetchPendingRequest
);

//api for the fetching the morning shift user data
router.get(
  "/users/morning-orders",
  authenticateUser,
  authorizeRole(["admin", "delivery_boy"]),
  adminController.getTodaysMorningOrder
);

//api for the fetching the evening shift user data
router.get(
  "/users/evening-orders",
  authenticateUser,
  authorizeRole(["admin", "delivery_boy"]),
  adminController.getTodaysEveningOrder
);

// 🔹 Register Delivery Boy (Admin Only)
router.post(
  "/register-delivery-boy",
  authenticateUser,
  isAdminLoggedIn,
  authorizeRole(["admin"]),
  adminController.registerDeliveryBoy
);

// Put received Payment
router.put(
  "/:userid/add-received-payment",
  authenticateUser,
  isAdminLoggedIn,
  authorizeRole(["admin"]),
  adminController.updateReceivedPayment
);
// Put Advance Payment
router.put(
  "/:userid/advance-payment",
  authenticateUser,
  isAdminLoggedIn,
  authorizeRole(["admin"]),
  adminController.updateadvancePayment
);

///get the payment detals
router.get(
  "/users-lastmonth-payment-details",
  authenticateUser,
  authorizeRole(["admin"]),
  adminController.getAdminUsersLastMonthPayments
);
///total last month payment
router.get(
  "/total-lastmonth-payment",
  authenticateUser,
  authorizeRole(["admin"]),
  adminController.getLastMonthTotalPayments
);

//get last month milk quantity
router.get(
  "/last-month-milk-quantity",
  authenticateUser,
  authorizeRole(["admin"]),
  adminController.getLastMonthTotalMilk
);

//get the deliveryboy
router.get(
  "/delivery-boy",
  authenticateUser,
  authorizeRole(["admin"]),
  adminController.fetchDeliveryBoy
);

//api for delete the delivery boy
router.delete(
  "/delete-delivery-boy/:id",
  authenticateUser,
  authorizeRole(["admin"]),
  adminController.deleteDeliveryBoy
);
//api for the give the dairylist
router.get("/dairylist", adminController.dairyList);

//api for delete the user
router.delete("/users/:id", adminController.deleteUser);

router.get(
  "/res-periods",
  authenticateUser,
  authorizeRole(["admin"]),
  adminController.resDate
);

// API to get the profile of a particular admin
router.get(
  "/profile/me",
  authenticateUser,
  authorizeRole(["admin"]),
  adminController.profile
);

// API to update the profile of a particular admin
router.put(
  "/profile",
  authenticateUser,
  authorizeRole(["admin"]),
  adminController.updateProfile
);

//api to update the quantity of the milk
router.put(
  "/update-quantity/:userId",
  authenticateUser,
  authorizeRole(["admin"]),
  adminController.updateQuantity
);

//api for the get the delivery status
router.get(
  "/deliveryStatus",
  authenticateUser,
  authorizeRole(["admin"]),
  adminController.getDeliveredMorningOrder
);

router.get(
  "/deliveryStatusEvening",
  authenticateUser,
  authorizeRole(["admin"]),
  adminController.getDeliveredEveningOrder
);

//api for the fetching the morning shift user data
router.get(
  "/users/All-morning-orders",
  authenticateUser,
  authorizeRole(["admin"]),
  adminController.getAllMorningOrders
);

//api for the fetching the evening shift user data
router.get(
  "/users/All-evening-orders",
  authenticateUser,
  authorizeRole(["admin"]),
  adminController.getAllEveningOrders
);

//api for updating delivery sequence
router.put(
  "/users/update-delivery-sequence",
  authenticateUser,
  authorizeRole(["admin"]),
  adminController.updateDeliverySequence
);

//get Admin name
router.get(
  "/admin-name",
  authenticateUser,
  authorizeRole(["admin"]),
  adminController.AdminName
);

//api for register the farmer
router.post(
  "/farmer_registration",
  authenticateUser,
  authorizeRole(["admin"]),
  validateFarmerRegistration,
  adminController.registerFarmer
);

//get the list of the all farmer
router.get(
  "/Farmer_list",
  authenticateUser,
  authorizeRole(["admin"]),
  adminController.getAllFarmers
);

//api for the add the new product
router.post(
  "/farmer/:farmer_id/add_product",
  authenticateUser,
  authorizeRole(["admin"]),
  adminController.addNewProduct
);

//api for update the farmer status
router.put(
  "/farmer/:id/update_status",
  authenticateUser,
  authorizeRole(["admin"]),
  adminController.updateFarmerStatus
);

//get all pending payment
router.get(
  "/farmer/pending-payment",
  authenticateUser,
  authorizeRole(["admin"]),
  adminController.getAllPendingFarmerPayments
);

//update the payment status
router.put(
  "/farmer/payment/:id",
  authenticateUser,
  authorizeRole(["admin"]),
  adminController.updateFarmerPaymentStatusById
);

///update the advance payment
router.put(
  "/farmer/advance_payment/:farmer_id",
  authenticateUser,
  authorizeRole(["admin"]),
  adminController.updateFarmeradvancePayment
);

//get the all last month
router.get(
  "/farmer/LastMonthOrder",
  authenticateUser,
  authorizeRole(["admin"]),
  adminController.getallDailyOrderHistory
);

// api for the fetching the additional order user data
router.get(
  "/users/additional-orders",
  authenticateUser,
  authorizeRole(["admin"]),
  adminController.getTodaysAdditional
);

//get the delivered status of additional order
router.get(
  "/additional_deliveryStatus",
  authenticateUser,
  authorizeRole(["admin"]),
  adminController.getDeliveredAdditionalOrder
);

//put the fcm token of the admin
router.put(
  "/update_fcm_token",
  authenticateUser,
  authorizeRole(["admin"]),
  adminController.updateFCMToken
);

//Put Api to update rates for farmer
router.put(
  "/add_farmer_Milkrate",
  authenticateUser,
  authorizeRole(["admin"]),
  adminController.add_Farmer_Rate
);

//Get Api to get rates for farmer
router.get(
  "/get_farmer_Milkrate",
  authenticateUser,
  authorizeRole(["admin", "farmer"]),
  adminController.getAllRate
);

//Api to change status of the morning order after Auto Submit
router.put(
  "/update_delivery_status/:id",
  authenticateUser,
  authorizeRole(["admin"]),
  adminController.updateDeliveryStatus
);

// Get milk distribution for all delivery boys (today and yesterday)
router.get(
  "/milk-distribution",
  authenticateUser,
  authorizeRole(["admin"]),
  adminController.getMilkDistribution
);

// Update milk distribution for a delivery boy for today
router.put(
  "/milk-distribution",
  authenticateUser,
  authorizeRole(["admin"]),
  adminController.updateMilkDistribution
);

// Get daily report metrics
router.get(
  "/daily-report",
  authenticateUser,
  authorizeRole(["admin"]),
  adminController.getDailyReport
);

// Get delivery boy monthly report
router.get(
  "/delivery-boy-monthly-report",
  authenticateUser,
  authorizeRole(["admin"]),
  adminController.getDeliveryBoyMonthlyReport
);

module.exports = router;
