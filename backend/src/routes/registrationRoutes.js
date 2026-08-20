// // const express = require("express");
// // const router = express.Router();
// // const { authenticate } = require("../middleware/auth");

// // const {
// //     createFullRegistration,
// //     getRegistrations,
// //     getRegistration,
// //     updateRegistrationStatus,
// //     deleteRegistration,
// //     getAllRegistrationsForAdmin,
// //     checkAvailability,
// //     updateRegistration
// // } = require("../controllers/registrationController");

// // // All registration routes require authentication
// // router.use(authenticate);
// // // Check availability (phone and license plate)
// // router.post("/check-availability", checkAvailability);
// // // Create full registration (car + driver + binding)
// // router.post("/", createFullRegistration);

// // // Get all registrations (with filters)
// // router.get("/", getRegistrations);
// // // Get ALL registrations for performance (no filter)
// // router.get("/admin/all", getAllRegistrationsForAdmin);

// // router.put("/update/:driver_id", updateRegistration);

// // // Get registration by ID
// // router.get("/:id", getRegistration);

// // // Update registration status
// // router.patch("/:id/status", updateRegistrationStatus);

// // // Delete registration
// // router.delete("/:id", deleteRegistration);


// // module.exports = router;

// // registrationRoutes.js
// const express = require("express");
// const router = express.Router();
// const { authenticate } = require("../middleware/auth");

// const {
//     createFullRegistration,
//     getRegistrations,
//     getRegistration,
//     updateRegistrationStatus,
//     deleteRegistration,
//     getAllRegistrationsForAdmin,
//     checkAvailability,
//     updateRegistration
// } = require("../controllers/registrationController");

// // All registration routes require authentication
// router.use(authenticate);

// // ✅ CHECK AVAILABILITY
// router.post("/check-availability", checkAvailability);

// // ✅ CREATE - New registration
// router.post("/", createFullRegistration);

// // ✅ UPDATE - Must come BEFORE /:id routes
// router.put("/update/:driver_id", updateRegistration);  // ← This must be here

// // ✅ GET ALL
// router.get("/", getRegistrations);
// router.get("/admin/all", getAllRegistrationsForAdmin);

// // ⚠️ GET BY ID - Must come AFTER /update routes
// router.get("/:id", getRegistration);

// // ✅ UPDATE STATUS & DELETE
// router.patch("/:id/status", updateRegistrationStatus);
// router.delete("/:id", deleteRegistration);

// module.exports = router;


const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");

const {
    createFullRegistration,
    getRegistrations,
    getRegistration,
    updateRegistrationStatus,
    deleteRegistration,
    getAllRegistrationsForAdmin,
    checkAvailability,
    updateRegistration
} = require("../controllers/registrationController");

// All registration routes require authentication
router.use(authenticate);

// ✅ CHECK AVAILABILITY
router.post("/check-availability", checkAvailability);

// ✅ CREATE - New registration
router.post("/", createFullRegistration);

// ✅ UPDATE - Must come BEFORE /:id routes
router.put("/:driver_id/update", updateRegistration);

// ✅ GET ALL
router.get("/", getRegistrations);
router.get("/admin/all", getAllRegistrationsForAdmin);

// ⚠️ GET BY ID - Must come AFTER /update routes
router.get("/:id", getRegistration);

// ✅ UPDATE STATUS & DELETE
router.patch("/:id/status", updateRegistrationStatus);
router.delete("/:id", deleteRegistration);

module.exports = router;