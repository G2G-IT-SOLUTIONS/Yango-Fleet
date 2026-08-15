const performanceModel = require("../models/performanceModel");

// ==========================================
// GET ALL PERFORMANCE REGISTRATIONS
// ==========================================

const getPerformanceRegistrations = async (req, res) => {
    try {
        console.log('📊 GET /api/performance/registrations - Fetching all registrations');
        
        const registrations = await performanceModel.getPerformanceRegistrations();
        
        console.log('📊 Found registrations:', registrations.length);

        res.status(200).json({
            success: true,
            count: registrations.length,
            data: registrations
        });
    } catch (error) {
        console.error("❌ Get performance registrations error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get performance registrations",
            error: error.message
        });
    }
};

// ==========================================
// GET PERFORMANCE REGISTRATIONS BY DATE
// ==========================================

const getPerformanceRegistrationsByDate = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: "startDate and endDate are required"
            });
        }
        
        console.log(`📊 GET /api/performance/registrations - Date range: ${startDate} to ${endDate}`);
        
        const registrations = await performanceModel.getPerformanceRegistrationsByDate(startDate, endDate);
        
        console.log('📊 Found registrations:', registrations.length);

        res.status(200).json({
            success: true,
            count: registrations.length,
            data: registrations
        });
    } catch (error) {
        console.error("❌ Get performance registrations by date error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get performance registrations",
            error: error.message
        });
    }
};

// ==========================================
// GET PERFORMANCE SUMMARY
// ==========================================

const getPerformanceSummary = async (req, res) => {
    try {
        console.log('📊 GET /api/performance/summary - Fetching summary');
        
        const summary = await performanceModel.getPerformanceSummary();
        
        console.log('📊 Summary:', summary);

        res.status(200).json({
            success: true,
            data: {
                totalTeamMembers: parseInt(summary.total_team_members) || 0,
                totalTeamLeaders: parseInt(summary.total_team_leaders) || 0,
                totalRegistrations: parseInt(summary.total_registrations) || 0,
                avgPerMember: parseFloat(summary.avg_per_member) || 0
            }
        });
    } catch (error) {
        console.error("❌ Get performance summary error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get performance summary",
            error: error.message
        });
    }
};

// ==========================================
// GET TEAM PERFORMANCE
// ==========================================

const getTeamPerformance = async (req, res) => {
    try {
        console.log('📊 GET /api/performance/teams - Fetching team performance');
        
        const teams = await performanceModel.getTeamPerformance();
        
        console.log('📊 Found teams:', teams.length);

        // Format the response
        const formattedTeams = teams.map(team => ({
            teamLeaderId: team.team_leader_id,
            teamLeaderFirstName: team.team_leader_first_name,
            teamLeaderLastName: team.team_leader_last_name,
            memberCount: parseInt(team.member_count) || 0,
            totalRegistrations: parseInt(team.total_registrations) || 0,
            avgPerMember: parseFloat(team.avg_per_member) || 0,
            members: team.members || []
        }));

        res.status(200).json({
            success: true,
            data: formattedTeams
        });
    } catch (error) {
        console.error("❌ Get team performance error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get team performance",
            error: error.message
        });
    }
};

// ==========================================
// GET TEAM PERFORMANCE BY DATE
// ==========================================

const getTeamPerformanceByDate = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: "startDate and endDate are required"
            });
        }
        
        console.log(`📊 GET /api/performance/teams - Date range: ${startDate} to ${endDate}`);
        
        const teams = await performanceModel.getTeamPerformanceByDate(startDate, endDate);
        
        console.log('📊 Found teams:', teams.length);

        const formattedTeams = teams.map(team => ({
            teamLeaderId: team.team_leader_id,
            teamLeaderFirstName: team.team_leader_first_name,
            teamLeaderLastName: team.team_leader_last_name,
            memberCount: parseInt(team.member_count) || 0,
            totalRegistrations: parseInt(team.total_registrations) || 0,
            avgPerMember: parseFloat(team.avg_per_member) || 0,
            members: team.members || []
        }));

        res.status(200).json({
            success: true,
            data: formattedTeams
        });
    } catch (error) {
        console.error("❌ Get team performance by date error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get team performance",
            error: error.message
        });
    }
};

// ==========================================
// GET TOP PERFORMING TEAM
// ==========================================

const getTopPerformingTeam = async (req, res) => {
    try {
        console.log('📊 GET /api/performance/top-team - Fetching top team');
        
        const topTeam = await performanceModel.getTopPerformingTeam();
        
        if (!topTeam) {
            return res.status(200).json({
                success: true,
                data: null,
                message: "No teams found"
            });
        }

        res.status(200).json({
            success: true,
            data: {
                teamLeaderId: topTeam.team_leader_id,
                teamLeaderFirstName: topTeam.team_leader_first_name,
                teamLeaderLastName: topTeam.team_leader_last_name,
                memberCount: parseInt(topTeam.member_count) || 0,
                totalRegistrations: parseInt(topTeam.total_registrations) || 0,
                avgPerMember: parseFloat(topTeam.avg_per_member) || 0
            }
        });
    } catch (error) {
        console.error("❌ Get top performing team error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get top performing team",
            error: error.message
        });
    }
};

// ==========================================
// GET TOP PERFORMING MEMBER
// ==========================================

const getTopPerformingMember = async (req, res) => {
    try {
        console.log('📊 GET /api/performance/top-member - Fetching top member');
        
        const topMember = await performanceModel.getTopPerformingMember();
        
        if (!topMember) {
            return res.status(200).json({
                success: true,
                data: null,
                message: "No members found"
            });
        }

        res.status(200).json({
            success: true,
            data: {
                memberId: topMember.member_id,
                memberFirstName: topMember.member_first_name,
                memberLastName: topMember.member_last_name,
                teamLeaderId: topMember.team_leader_id,
                teamLeaderFirstName: topMember.team_leader_first_name,
                teamLeaderLastName: topMember.team_leader_last_name,
                registrationCount: parseInt(topMember.registration_count) || 0
            }
        });
    } catch (error) {
        console.error("❌ Get top performing member error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get top performing member",
            error: error.message
        });
    }
};
// ==========================================
// GET RAW REGISTRATIONS (For debugging)
// ==========================================

const getRawRegistrations = async (req, res) => {
    try {
        console.log('📊 GET /api/performance/debug - Fetching raw registrations');
        
        const registrations = await performanceModel.getRawRegistrations();
        
        console.log('📊 Raw registrations found:', registrations.length);

        res.status(200).json({
            success: true,
            count: registrations.length,
            data: registrations
        });
    } catch (error) {
        console.error("❌ Get raw registrations error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get raw registrations",
            error: error.message
        });
    }
};

module.exports = {
    getPerformanceRegistrations,
    getPerformanceRegistrationsByDate,
    getPerformanceSummary,
    getTeamPerformance,
    getTeamPerformanceByDate,
    getTopPerformingTeam,
    getTopPerformingMember,
    getRawRegistrations
};