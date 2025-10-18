const express = require("express");

const { authenticateUser, authorizeRole } = require("../middlewares/authontication");

const router = express.Router();

const deliveryBoyController = require("../controllers/deliveryBoy");


//APi for the update the delivery status
router.post("/users/:id/delivery", authenticateUser, authorizeRole(["admin", "delivery_boy"]), deliveryBoyController.UpdateDeliveryStatus);

//api for fetching the pending morning delivery orders
router.get("/users/pending-morning-orders", authenticateUser, authorizeRole(["admin", "delivery_boy"]), deliveryBoyController.morningPendingOrders);

//api for the fetching the evening pending delivery orders 
router.get("/users/pending-evening-orders", authenticateUser, authorizeRole(["admin", "delivery_boy"]), deliveryBoyController.eveningPendingOrders);

//api for adding the delivery records
router.post('/users/add-records',authenticateUser, authorizeRole(["admin", "delivery_boy"]),deliveryBoyController.addDeliveryRecord)

module.exports = router;
