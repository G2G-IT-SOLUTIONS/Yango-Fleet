const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth");

const {
    login,
    logout,
    getCurrentEmployee,
    changePassword
} = require("../controllers/authController");

// Public routes
router.post("/login", login);

// Protected routes
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, getCurrentEmployee);
router.post("/change-password", authenticate, changePassword);

module.exports = router;