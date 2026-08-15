const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const { getWorkRules } = require("../controllers/workRulesController");

// Get work rules (requires authentication)
router.get("/", authenticate, getWorkRules);

module.exports = router;