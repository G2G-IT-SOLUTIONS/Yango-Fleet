const express = require("express");
const router = express.Router();

const {
    createDriver,
    getDriver,
    getDrivers,
    updateDriver,
    deleteDriver,
    syncDriverToYango
} = require("../controllers/driverController");

// Create driver
router.post("/", createDriver);

// Get all drivers
router.get("/", getDrivers);

// Get one driver
router.get("/:id", getDriver);

// Update driver
router.put("/:id", updateDriver);

// Delete driver
router.delete("/:id", deleteDriver);

// Sync driver to Yango
router.post("/:id/sync-yango", syncDriverToYango);

module.exports = router;