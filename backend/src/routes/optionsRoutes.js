const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const { getAllOptions,getVehicleTypes } = require("../controllers/optionsController");

// Get all options for registration form
router.get("/all", authenticate, getAllOptions);
router.get("/vehicle-types", getVehicleTypes);
module.exports = router;