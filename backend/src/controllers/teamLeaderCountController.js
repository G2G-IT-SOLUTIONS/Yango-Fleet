const teamLeaderCountModel = require("../models/teamLeaderCountModel");

// GET MEMBER COUNT FOR ALL TEAM LEADERS
const getTeamLeaderMemberCountsController = async (req, res) => {
    try {
        const counts = await teamLeaderCountModel.getTeamLeaderMemberCounts();

        return res.status(200).json({
            success: true,
            data: counts.map(item => ({
                team_leader_id: item.team_leader_id,
                member_count: Number(item.member_count) || 0
            }))
        });

    } catch (error) {
        console.error(
            "❌ Error getting team leader member counts:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to get team leader member counts",
            error: error.message
        });
    }
};

module.exports = {
    getTeamLeaderMemberCountsController
};