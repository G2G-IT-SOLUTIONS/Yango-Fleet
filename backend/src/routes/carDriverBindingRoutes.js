const express = require("express");
const router = express.Router();

const {
    createBinding,
    getBinding,
    getBindings,
    getActiveBindingByCar,
    getActiveBindingByDriver,
    unbindCarDriver,
    syncBindingToYango
} = require("../controllers/carDriverBindingController");

// Create binding
router.post("/", createBinding);

// Get all bindings (with filters)
router.get("/", getBindings);

// Get binding by ID
router.get("/:id", getBinding);

// Get active binding by car
router.get("/car/:car_id/active", getActiveBindingByCar);

// Get active binding by driver
router.get("/driver/:driver_id/active", getActiveBindingByDriver);

// Unbind car and driver
router.put("/:id/unbind", unbindCarDriver);

// Sync binding to Yango
router.post("/:id/sync-yango", syncBindingToYango);

module.exports = router;