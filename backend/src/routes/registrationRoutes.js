const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");

const {
    createFullRegistration,
    getRegistrations,
    getRegistration,
    updateRegistrationStatus,
    deleteRegistration,
    getAllRegistrationsForAdmin
} = require("../controllers/registrationController");

// All registration routes require authentication
router.use(authenticate);

// Create full registration (car + driver + binding)
router.post("/", createFullRegistration);

// Get all registrations (with filters)
router.get("/", getRegistrations);
// Get ALL registrations for performance (no filter)
router.get("/admin/all", getAllRegistrationsForAdmin);

// Get registration by ID
router.get("/:id", getRegistration);

// Update registration status
router.patch("/:id/status", updateRegistrationStatus);

// Delete registration
router.delete("/:id", deleteRegistration);

module.exports = router;