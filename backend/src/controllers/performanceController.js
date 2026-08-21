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
// GET TEAM PERFORMANCE (UPDATED - includes leader registrations)
// ==========================================

const getTeamPerformance = async (req, res) => {
    try {
        console.log('📊 GET /api/performance/teams - Fetching team performance');
        
        const teams = await performanceModel.getTeamPerformance();
        
        console.log('📊 Found teams:', teams.length);

        // Format the response with leader registrations included
        const formattedTeams = teams.map(team => ({
            teamLeaderId: team.team_leader_id,
            teamLeaderFirstName: team.team_leader_first_name,
            teamLeaderLastName: team.team_leader_last_name,
            memberCount: parseInt(team.member_count) || 0,
            totalRegistrations: parseInt(team.total_registrations) || 0,
            leaderRegistrations: parseInt(team.leader_registrations) || 0,
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
// GET TEAM PERFORMANCE BY DATE (UPDATED - includes leader registrations)
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
        
        console.log(`📊 GET /api/performance/teams/date-range - Date range: ${startDate} to ${endDate}`);
        
        const teams = await performanceModel.getTeamPerformanceByDate(startDate, endDate);
        
        console.log('📊 Found teams:', teams.length);

        // Format the response with leader registrations included
        const formattedTeams = teams.map(team => ({
            teamLeaderId: team.team_leader_id,
            teamLeaderFirstName: team.team_leader_first_name,
            teamLeaderLastName: team.team_leader_last_name,
            memberCount: parseInt(team.member_count) || 0,
            totalRegistrations: parseInt(team.total_registrations) || 0,
            leaderRegistrations: parseInt(team.leader_registrations) || 0,
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
// GET TOP PERFORMING TEAM (UPDATED - includes leader registrations)
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
                leaderRegistrations: parseInt(topTeam.leader_registrations) || 0
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

// ==========================================
// GET TEAM LEADER MEMBERS
// ==========================================

const getTeamLeaderMembers = async (req, res) => {
    try {
        const teamLeaderId = req.employeeId; // From authenticated token
        
        console.log(`📊 GET /api/performance/team-leader/members - Team Leader ID: ${teamLeaderId}`);
        
        // Get all members under this team leader
        const members = await performanceModel.getTeamLeaderMembers(teamLeaderId);
        
        // Get performance summary for this team leader
        const summary = await performanceModel.getTeamLeaderPerformanceSummary(teamLeaderId);
        
        console.log(`📊 Found ${members.length} members for team leader ${teamLeaderId}`);

        res.status(200).json({
            success: true,
            data: {
                teamLeaderId: teamLeaderId,
                summary: summary || {
                    total_members: 0,
                    total_registrations: 0,
                    avg_per_member: 0,
                    total_cars_registered: 0,
                    total_drivers_registered: 0,
                    max_registrations: 0,
                    min_registrations: 0
                },
                members: members.map(member => ({
                    id: member.member_id,
                    firstName: member.member_first_name,
                    lastName: member.member_last_name,
                    phone: member.member_phone,
                    email: member.member_email,
                    role: member.member_role,
                    isActive: member.is_active,
                    memberSince: member.member_since,
                    totalRegistrations: parseInt(member.total_registrations) || 0,
                    registrations: member.registrations || []
                }))
            }
        });
    } catch (error) {
        console.error("❌ Get team leader members error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get team leader members",
            error: error.message
        });
    }
};

// ==========================================
// GET TEAM LEADER MEMBER REGISTRATIONS
// ==========================================

const getTeamLeaderMemberRegistrations = async (req, res) => {
    try {
        const teamLeaderId = req.employeeId; // From authenticated token
        const { memberId } = req.params;
        
        if (!memberId) {
            return res.status(400).json({
                success: false,
                message: "memberId is required"
            });
        }
        
        console.log(`📊 GET /api/performance/team-leader/member/${memberId}/registrations - Team Leader ID: ${teamLeaderId}`);
        
        // Get registrations for this specific member under this team leader
        const registrations = await performanceModel.getTeamLeaderMemberRegistrations(teamLeaderId, memberId);
        
        // Get member details
        const member = await performanceModel.getTeamLeaderMembers(teamLeaderId);
        const memberDetails = member.find(m => m.member_id === memberId);
        
        console.log(`📊 Found ${registrations.length} registrations for member ${memberId}`);

        res.status(200).json({
            success: true,
            data: {
                member: memberDetails ? {
                    id: memberDetails.member_id,
                    firstName: memberDetails.member_first_name,
                    lastName: memberDetails.member_last_name,
                    phone: memberDetails.member_phone,
                    email: memberDetails.member_email,
                    totalRegistrations: parseInt(memberDetails.total_registrations) || 0
                } : null,
                registrations: registrations.map(reg => ({
                    id: reg.id,
                    registrationDate: reg.registration_date,
                    status: reg.status,
                    yangoSynced: reg.yango_synced,
                    createdAt: reg.created_at,
                    car: {
                        id: reg.car_id,
                        brand: reg.car_brand,
                        model: reg.car_model,
                        color: reg.car_color,
                        year: reg.car_year,
                        licensePlate: reg.car_license_plate,
                        vin: reg.car_vin,
                        vehicleTypeId: reg.vehicle_type_id
                    },
                    driver: {
                        id: reg.driver_id,
                        firstName: reg.driver_first_name,
                        lastName: reg.driver_last_name,
                        phone: reg.driver_phone,
                        email: reg.driver_email,
                        licenseNumber: reg.driver_license_number
                    },
                    employee: {
                        id: reg.employee_id,
                        firstName: reg.employee_first_name,
                        lastName: reg.employee_last_name,
                        phone: reg.employee_phone,
                        email: reg.employee_email
                    }
                }))
            }
        });
    } catch (error) {
        console.error("❌ Get team leader member registrations error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get member registrations",
            error: error.message
        });
    }
};

// ==========================================
// GET TEAM LEADER PERFORMANCE SUMMARY
// ==========================================

const getTeamLeaderPerformanceSummary = async (req, res) => {
    try {
        const teamLeaderId = req.employeeId; // From authenticated token
        
        console.log(`📊 GET /api/performance/team-leader/summary - Team Leader ID: ${teamLeaderId}`);
        
        const summary = await performanceModel.getTeamLeaderPerformanceSummary(teamLeaderId);
        const members = await performanceModel.getTeamLeaderMembersWithStats(teamLeaderId);
        
        console.log(`📊 Summary retrieved for team leader ${teamLeaderId}`);

        res.status(200).json({
            success: true,
            data: {
                summary: summary || {
                    total_members: 0,
                    total_registrations: 0,
                    avg_per_member: 0,
                    total_cars_registered: 0,
                    total_drivers_registered: 0,
                    max_registrations: 0,
                    min_registrations: 0
                },
                members: members.map(m => ({
                    id: m.member_id,
                    firstName: m.member_first_name,
                    lastName: m.member_last_name,
                    phone: m.member_phone,
                    email: m.member_email,
                    memberSince: m.member_since,
                    totalRegistrations: parseInt(m.total_registrations) || 0,
                    uniqueCars: parseInt(m.unique_cars) || 0,
                    uniqueDrivers: parseInt(m.unique_drivers) || 0,
                    lastRegistration: m.last_registration,
                    firstRegistration: m.first_registration
                }))
            }
        });
    } catch (error) {
        console.error("❌ Get team leader performance summary error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get team leader performance summary",
            error: error.message
        });
    }
};

// ==========================================
// GET TEAM LEADER REGISTRATIONS (NEW)
// ==========================================

const getTeamLeaderRegistrations = async (req, res) => {
    try {
        const teamLeaderId = req.employeeId; // From authenticated token
        
        console.log(`📊 GET /api/performance/team-leader/registrations - Team Leader ID: ${teamLeaderId}`);
        
        // Get registrations made by the team leader
        const registrations = await performanceModel.getTeamLeaderRegistrations(teamLeaderId);
        
        console.log(`📊 Found ${registrations.length} registrations for team leader ${teamLeaderId}`);

        res.status(200).json({
            success: true,
            data: {
                teamLeaderId: teamLeaderId,
                totalRegistrations: registrations.length,
                registrations: registrations.map(reg => ({
                    id: reg.id,
                    registrationDate: reg.registration_date,
                    status: reg.status,
                    yangoSynced: reg.yango_synced,
                    createdAt: reg.created_at,
                    car: {
                        id: reg.car_id,
                        brand: reg.car_brand,
                        model: reg.car_model,
                        color: reg.car_color,
                        year: reg.car_year,
                        licensePlate: reg.car_license_plate,
                        vin: reg.car_vin,
                        vehicleTypeId: reg.vehicle_type_id
                    },
                    driver: {
                        id: reg.driver_id,
                        firstName: reg.driver_first_name,
                        lastName: reg.driver_last_name,
                        phone: reg.driver_phone,
                        email: reg.driver_email,
                        licenseNumber: reg.driver_license_number
                    }
                }))
            }
        });
    } catch (error) {
        console.error("❌ Get team leader registrations error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get team leader registrations",
            error: error.message
        });
    }
};

// ==========================================
// MODULE EXPORTS
// ==========================================

module.exports = {
    getPerformanceRegistrations,
    getPerformanceRegistrationsByDate,
    getPerformanceSummary,
    getTeamPerformance,
    getTeamPerformanceByDate,
    getTopPerformingTeam,
    getTopPerformingMember,
    getRawRegistrations,
    getTeamLeaderMembers,
    getTeamLeaderMemberRegistrations,
    getTeamLeaderPerformanceSummary,
    getTeamLeaderRegistrations
};
