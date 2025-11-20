const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
require("dotenv").config();
const { validateAllAdminRegistration } = require("../validators/adminValidation");
const superAdminController = require("../controllers/superAdmin");
const { authenticateUser, authorizeRole } = require("../middlewares/authontication");
const router = express.Router();

// Admin Registration (POST)
router.post("/register", superAdminController.RegisterSuperAdmin);

//Api for the login 
router.post("/login", superAdminController.login);

//Api for the register the admin through the superadmin
router.post("/register-admin", validateAllAdminRegistration, authenticateUser, authorizeRole(["super_admin"]), superAdminController.RegisterAdmin);

// Fetch all admins for SuperAdmin
router.get("/admins", authenticateUser, authorizeRole(["super_admin"]), superAdminController.FetchALlAdmin);

//api for the update the status of the admin
router.put("/admin/:id/update", authenticateUser, authorizeRole(["super_admin"]), superAdminController.updateAdminRequestStatus);

//api for the update the status of the admin
router.put("/admin/:id/update-Payment", authenticateUser, authorizeRole(["super_admin"]), superAdminController.updateAdminPayment);

// //api for the reset the password
router.post("/send_recovery_email", superAdminController.sendemailOtp);

router.post('/resetPass', superAdminController.resetPass);

module.exports = router;
