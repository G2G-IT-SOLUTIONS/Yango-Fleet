const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");

const {
    getPerformanceRegistrations,
    getPerformanceRegistrationsByDate,
    getPerformanceSummary,
    getTeamPerformance,
    getTeamPerformanceByDate,
    getTopPerformingTeam,
    getTopPerformingMember,
    getRawRegistrations,
    getTeamLeaderMembers,          // ← NEW
    getTeamLeaderMemberRegistrations 
} = require("../controllers/performanceController");

// All performance routes require authentication
router.use(authenticate);

// Get all performance registrations
router.get("/registrations", getPerformanceRegistrations);

// Get performance registrations by date range
router.get("/registrations/date-range", getPerformanceRegistrationsByDate);

// Get performance summary
router.get("/summary", getPerformanceSummary);

// Get team performance
router.get("/teams", getTeamPerformance);

// Get team performance by date range
router.get("/teams/date-range", getTeamPerformanceByDate);

// Get top performing team
router.get("/top-team", getTopPerformingTeam);

// Get top performing member
router.get("/top-member", getTopPerformingMember);
// Get all members under a specific team leader
router.get("/team-leader/members", getTeamLeaderMembers);

// Get registrations for a specific member under a team leader
router.get("/team-leader/member/:memberId/registrations", getTeamLeaderMemberRegistrations);

module.exports = router;