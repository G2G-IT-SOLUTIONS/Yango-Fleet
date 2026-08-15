const express = require("express");

const router = express.Router();

const {
    createCar,
    getCar,
    getCars,
    updateCar,
    deleteCar,
    syncCarToYango
} = require("../controllers/carController");


// Create car
router.post("/", createCar);

// Get all cars
router.get("/", getCars);

// Get one car
router.get("/:id", getCar);

// Update car
router.put("/:id", updateCar);

// Delete car
router.delete("/:id", deleteCar);

// Send/synchronize car to Yango
router.post("/:id/sync-yango", syncCarToYango);


module.exports = router;