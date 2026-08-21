const express = require("express");

const router = express.Router();

const {
    getTeamLeaderMemberCountsController
} = require("../controllers/teamLeaderCountController");

// Get member counts for all team leaders
router.get("/", getTeamLeaderMemberCountsController);

module.exports = router;