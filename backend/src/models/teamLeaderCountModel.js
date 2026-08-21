const pool = require("../config/db");

// Get the number of active team members for every team leader
const getTeamLeaderMemberCounts = async () => {
    const query = `
        SELECT
            tl.id AS team_leader_id,
            COUNT(tm.id) AS member_count
        FROM employees tl
        LEFT JOIN employees tm
            ON tm.team_leader_id = tl.id
            AND tm.role = 'team_member'
            AND tm.is_active = TRUE
        WHERE tl.role = 'team_leader'
        GROUP BY tl.id
        ORDER BY tl.id;
    `;

    console.log("📊 Getting team leader member counts...");

    const result = await pool.query(query);

    console.log("📊 Member counts:", result.rows);

    return result.rows;
};

module.exports = {
    getTeamLeaderMemberCounts
};