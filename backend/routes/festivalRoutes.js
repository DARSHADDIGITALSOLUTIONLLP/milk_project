const express = require("express");
const router = express.Router();
const festivalController = require("../controllers/festival");
const { authenticateUser, authorizeRole } = require("../middlewares/authontication");

// Public routes
router.get("/active", festivalController.getActiveFestivals);
router.get("/date/:date", festivalController.getFestivalByDate);

// SuperAdmin only routes
router.get("/", authenticateUser, authorizeRole(["super_admin"]), festivalController.getAllFestivals);
router.post("/", authenticateUser, authorizeRole(["super_admin"]), festivalController.createFestival);
router.put("/:id", authenticateUser, authorizeRole(["super_admin"]), festivalController.updateFestival);
router.delete("/:id", authenticateUser, authorizeRole(["super_admin"]), festivalController.deleteFestival);
router.post("/copy-to-next-year", authenticateUser, authorizeRole(["super_admin"]), festivalController.copyRecurringFestivals);

module.exports = router;
