const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const { getAllOptions } = require("../controllers/optionsController");

// Get all options for registration form
router.get("/all", authenticate, getAllOptions);

module.exports = router;