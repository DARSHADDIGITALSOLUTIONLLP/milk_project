const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const multer = require("multer");
require("dotenv").config();
const { validateAllAdminRegistration } = require("../validators/adminValidation");
const superAdminController = require("../controllers/superAdmin");
const { authenticateUser, authorizeRole } = require("../middlewares/authontication");
const router = express.Router();

// Configure multer for file upload (memory storage)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Admin Registration (POST)
router.post("/register", superAdminController.RegisterSuperAdmin);

//Api for the login 
router.post("/login", superAdminController.login);

//Api for the register the admin through the superadmin
router.post("/register-admin", upload.single('dairy_logo'), validateAllAdminRegistration, authenticateUser, authorizeRole(["super_admin"]), superAdminController.RegisterAdmin);

// Fetch all admins for SuperAdmin
router.get("/admins", authenticateUser, authorizeRole(["super_admin"]), superAdminController.FetchALlAdmin);

//api for the update the status of the admin
router.put("/admin/:id/update", authenticateUser, authorizeRole(["super_admin"]), superAdminController.updateAdminRequestStatus);

//api for the update the status of the admin
router.put("/admin/:id/update-Payment", authenticateUser, authorizeRole(["super_admin"]), superAdminController.updateAdminPayment);

// //api for the reset the password
router.post("/send_recovery_email", superAdminController.sendemailOtp);

router.post('/resetPass', superAdminController.resetPass);

// Test Festival Greetings (for testing purposes - SuperAdmin only)
router.post('/test-festival-greetings', authenticateUser, authorizeRole(["super_admin"]), superAdminController.testFestivalGreetings);

module.exports = router;
