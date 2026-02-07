const express = require("express");
const router = express.Router();
const {
  getAllPlans,
  getActivePlans,
  createPlan,
  updatePlan,
  deletePlan
} = require("../controllers/subscriptionPlan");
const { authenticateUser, authorizeRole } = require("../middlewares/authontication");

// Public route - Get active plans for registration page
router.get("/active", getActivePlans);

// Superadmin routes - Plan management
router.get("/", authenticateUser, authorizeRole(["super_admin"]), getAllPlans);
router.post("/", authenticateUser, authorizeRole(["super_admin"]), createPlan);
router.put("/:id", authenticateUser, authorizeRole(["super_admin"]), updatePlan);
router.delete("/:id", authenticateUser, authorizeRole(["super_admin"]), deletePlan);

module.exports = router;
