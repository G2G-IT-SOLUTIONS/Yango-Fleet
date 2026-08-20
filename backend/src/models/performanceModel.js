const pool = require("../config/db");

// ==========================================
// GET ALL REGISTRATIONS FOR PERFORMANCE
// ==========================================

const getPerformanceRegistrations = async () => {
    const query = `
        SELECT 
            r.id,
            r.car_id,
            r.driver_id,
            r.sales_employee_id,
            r.registration_date,
            r.status,
            r.yango_synced,
            r.created_at,
            -- Car details
            c.brand,
            c.model,
            c.license_plate_number,
            -- Driver details
            d.first_name AS driver_first_name,
            d.last_name AS driver_last_name,
            -- Employee details
            e.id AS employee_id,
            e.first_name AS employee_first_name,
            e.last_name AS employee_last_name,
            e.role AS employee_role,
            e.team_leader_id,
            tl.id AS team_leader_id,
            tl.first_name AS team_leader_first_name,
            tl.last_name AS team_leader_last_name
        FROM registrations r
        INNER JOIN cars c ON r.car_id = c.id
        INNER JOIN drivers d ON r.driver_id = d.id
        INNER JOIN employees e ON r.sales_employee_id = e.id
        LEFT JOIN employees tl ON e.team_leader_id = tl.id
        ORDER BY r.created_at DESC
    `;

    console.log('📊 Executing performance registrations query...');
    const result = await pool.query(query);
    console.log('📊 Performance registrations found:', result.rows.length);
    
    // Log sample data for debugging
    if (result.rows.length > 0) {
        console.log('📊 Sample registration:', {
            id: result.rows[0].id,
            sales_employee_id: result.rows[0].sales_employee_id,
            status: result.rows[0].status,
            employee_name: `${result.rows[0].employee_first_name} ${result.rows[0].employee_last_name}`
        });
    }
    
    return result.rows;
};

// ==========================================
// GET REGISTRATIONS BY DATE RANGE
// ==========================================

const getPerformanceRegistrationsByDate = async (startDate, endDate) => {
    const query = `
        SELECT 
            r.id,
            r.car_id,
            r.driver_id,
            r.sales_employee_id,
            r.registration_date,
            r.status,
            r.yango_synced,
            r.created_at,
            c.brand,
            c.model,
            c.license_plate_number,
            d.first_name AS driver_first_name,
            d.last_name AS driver_last_name,
            e.id AS employee_id,
            e.first_name AS employee_first_name,
            e.last_name AS employee_last_name,
            e.role AS employee_role,
            e.team_leader_id,
            tl.first_name AS team_leader_first_name,
            tl.last_name AS team_leader_last_name
        FROM registrations r
        INNER JOIN cars c ON r.car_id = c.id
        INNER JOIN drivers d ON r.driver_id = d.id
        INNER JOIN employees e ON r.sales_employee_id = e.id
        LEFT JOIN employees tl ON e.team_leader_id = tl.id
        WHERE r.registration_date BETWEEN $1 AND $2
        ORDER BY r.created_at DESC
    `;

    console.log(`📊 Executing performance registrations by date: ${startDate} to ${endDate}`);
    const result = await pool.query(query, [startDate, endDate]);
    console.log('📊 Performance registrations found:', result.rows.length);
    
    return result.rows;
};

// ==========================================
// GET PERFORMANCE SUMMARY
// ==========================================

const getPerformanceSummary = async () => {
    const query = `
        SELECT 
            COUNT(DISTINCT r.sales_employee_id) AS total_team_members,
            COUNT(DISTINCT e.team_leader_id) AS total_team_leaders,
            COUNT(r.id) AS total_registrations,
            COALESCE(AVG(member_stats.registration_count), 0) AS avg_per_member
        FROM registrations r
        INNER JOIN employees e ON r.sales_employee_id = e.id
        LEFT JOIN (
            SELECT sales_employee_id, COUNT(*) AS registration_count
            FROM registrations
            GROUP BY sales_employee_id
        ) AS member_stats ON member_stats.sales_employee_id = r.sales_employee_id
    `;

    console.log('📊 Executing performance summary query...');
    const result = await pool.query(query);
    console.log('📊 Performance summary result:', result.rows[0]);
    
    return result.rows[0];
};

// ==========================================
// GET TEAM PERFORMANCE
// ==========================================

const getTeamPerformance = async () => {
    const query = `
        WITH team_members AS (
            SELECT 
                e.team_leader_id,
                e.id AS member_id,
                e.first_name AS member_first_name,
                e.last_name AS member_last_name,
                COUNT(r.id) AS registration_count
            FROM employees e
            LEFT JOIN registrations r ON r.sales_employee_id = e.id
            WHERE e.role = 'team_member' AND e.is_active = TRUE
            GROUP BY e.team_leader_id, e.id, e.first_name, e.last_name
        ),
        team_summary AS (
            SELECT 
                tl.id AS team_leader_id,
                tl.first_name AS team_leader_first_name,
                tl.last_name AS team_leader_last_name,
                COUNT(DISTINCT tm.member_id) AS member_count,
                COALESCE(SUM(tm.registration_count), 0) AS total_registrations,
                COALESCE(AVG(tm.registration_count), 0) AS avg_per_member
            FROM employees tl
            LEFT JOIN team_members tm ON tm.team_leader_id = tl.id
            WHERE tl.role = 'team_leader' AND tl.is_active = TRUE
            GROUP BY tl.id, tl.first_name, tl.last_name
        )
        SELECT 
            ts.*,
            COALESCE(
                json_agg(
                    json_build_object(
                        'id', tm.member_id,
                        'first_name', tm.member_first_name,
                        'last_name', tm.member_last_name,
                        'registration_count', tm.registration_count
                    ) ORDER BY tm.registration_count DESC
                ) FILTER (WHERE tm.member_id IS NOT NULL),
                '[]'::json
            ) AS members
        FROM team_summary ts
        LEFT JOIN team_members tm ON tm.team_leader_id = ts.team_leader_id
        GROUP BY ts.team_leader_id, ts.team_leader_first_name, ts.team_leader_last_name, 
                 ts.member_count, ts.total_registrations, ts.avg_per_member
        ORDER BY ts.total_registrations DESC
    `;

    console.log('📊 Executing team performance query...');
    const result = await pool.query(query);
    console.log('📊 Teams found:', result.rows.length);
    
    if (result.rows.length > 0) {
        console.log('📊 Sample team:', {
            leader: `${result.rows[0].team_leader_first_name} ${result.rows[0].team_leader_last_name}`,
            total_registrations: result.rows[0].total_registrations,
            member_count: result.rows[0].member_count
        });
    }
    
    return result.rows;
};

// ==========================================
// GET TEAM PERFORMANCE BY DATE RANGE
// ==========================================

const getTeamPerformanceByDate = async (startDate, endDate) => {
    const query = `
        WITH team_members AS (
            SELECT 
                e.team_leader_id,
                e.id AS member_id,
                e.first_name AS member_first_name,
                e.last_name AS member_last_name,
                COUNT(r.id) AS registration_count
            FROM employees e
            LEFT JOIN registrations r ON r.sales_employee_id = e.id 
                AND r.registration_date BETWEEN $1 AND $2
            WHERE e.role = 'team_member' AND e.is_active = TRUE
            GROUP BY e.team_leader_id, e.id, e.first_name, e.last_name
        ),
        team_summary AS (
            SELECT 
                tl.id AS team_leader_id,
                tl.first_name AS team_leader_first_name,
                tl.last_name AS team_leader_last_name,
                COUNT(DISTINCT tm.member_id) AS member_count,
                COALESCE(SUM(tm.registration_count), 0) AS total_registrations,
                COALESCE(AVG(tm.registration_count), 0) AS avg_per_member
            FROM employees tl
            LEFT JOIN team_members tm ON tm.team_leader_id = tl.id
            WHERE tl.role = 'team_leader' AND tl.is_active = TRUE
            GROUP BY tl.id, tl.first_name, tl.last_name
        )
        SELECT 
            ts.*,
            COALESCE(
                json_agg(
                    json_build_object(
                        'id', tm.member_id,
                        'first_name', tm.member_first_name,
                        'last_name', tm.member_last_name,
                        'registration_count', tm.registration_count
                    ) ORDER BY tm.registration_count DESC
                ) FILTER (WHERE tm.member_id IS NOT NULL),
                '[]'::json
            ) AS members
        FROM team_summary ts
        LEFT JOIN team_members tm ON tm.team_leader_id = ts.team_leader_id
        GROUP BY ts.team_leader_id, ts.team_leader_first_name, ts.team_leader_last_name, 
                 ts.member_count, ts.total_registrations, ts.avg_per_member
        ORDER BY ts.total_registrations DESC
    `;

    console.log(`📊 Executing team performance by date: ${startDate} to ${endDate}`);
    const result = await pool.query(query, [startDate, endDate]);
    console.log('📊 Teams found:', result.rows.length);
    
    return result.rows;
};

// ==========================================
// GET TOP PERFORMING TEAM
// ==========================================

const getTopPerformingTeam = async () => {
    const query = `
        WITH team_performance AS (
            SELECT 
                tl.id AS team_leader_id,
                tl.first_name AS team_leader_first_name,
                tl.last_name AS team_leader_last_name,
                COUNT(DISTINCT e.id) AS member_count,
                COUNT(r.id) AS total_registrations,
                COALESCE(COUNT(r.id)::FLOAT / NULLIF(COUNT(DISTINCT e.id), 0), 0) AS avg_per_member
            FROM employees tl
            LEFT JOIN employees e ON e.team_leader_id = tl.id AND e.role = 'team_member' AND e.is_active = TRUE
            LEFT JOIN registrations r ON r.sales_employee_id = e.id
            WHERE tl.role = 'team_leader' AND tl.is_active = TRUE
            GROUP BY tl.id, tl.first_name, tl.last_name
        )
        SELECT * FROM team_performance
        ORDER BY total_registrations DESC
        LIMIT 1
    `;

    console.log('📊 Executing top performing team query...');
    const result = await pool.query(query);
    console.log('📊 Top team result:', result.rows[0]);
    
    return result.rows[0];
};

// ==========================================
// GET TOP PERFORMING MEMBER
// ==========================================

const getTopPerformingMember = async () => {
    const query = `
        SELECT 
            e.id AS member_id,
            e.first_name AS member_first_name,
            e.last_name AS member_last_name,
            e.team_leader_id,
            tl.first_name AS team_leader_first_name,
            tl.last_name AS team_leader_last_name,
            COUNT(r.id) AS registration_count
        FROM employees e
        LEFT JOIN registrations r ON r.sales_employee_id = e.id
        LEFT JOIN employees tl ON e.team_leader_id = tl.id
        WHERE e.role = 'team_member' AND e.is_active = TRUE
        GROUP BY e.id, e.first_name, e.last_name, e.team_leader_id, tl.first_name, tl.last_name
        ORDER BY registration_count DESC
        LIMIT 1
    `;

    console.log('📊 Executing top performing member query...');
    const result = await pool.query(query);
    console.log('📊 Top member result:', result.rows[0]);
    
    return result.rows[0];
};

// ==========================================
// GET RAW REGISTRATIONS (For debugging)
// ==========================================

const getRawRegistrations = async () => {
    const query = `
        SELECT 
            r.id,
            r.sales_employee_id,
            r.registration_date,
            r.status,
            e.first_name,
            e.last_name,
            e.role
        FROM registrations r
        INNER JOIN employees e ON r.sales_employee_id = e.id
        ORDER BY r.created_at DESC
    `;

    const result = await pool.query(query);
    return result.rows;
};

// ==========================================
// GET TEAM LEADER MEMBERS
// ==========================================

const getTeamLeaderMembers = async (teamLeaderId) => {
    const query = `
        SELECT 
            e.id AS member_id,
            e.first_name AS member_first_name,
            e.last_name AS member_last_name,
            e.phone AS member_phone,
            e.email AS member_email,
            e.role AS member_role,
            e.is_active,
            e.created_at AS member_since,
            COUNT(DISTINCT r.id) AS total_registrations,
            COALESCE(
                json_agg(
                    json_build_object(
                        'id', r.id,
                        'registration_date', r.registration_date,
                        'status', r.status,
                        'yango_synced', r.yango_synced,
                        'created_at', r.created_at,
                        'car_brand', c.brand,
                        'car_model', c.model,
                        'car_license_plate', c.license_plate_number,
                        'driver_first_name', d.first_name,
                        'driver_last_name', d.last_name
                    ) ORDER BY r.created_at DESC
                ) FILTER (WHERE r.id IS NOT NULL),
                '[]'::json
            ) AS registrations
        FROM employees e
        LEFT JOIN registrations r ON r.sales_employee_id = e.id
        LEFT JOIN cars c ON r.car_id = c.id
        LEFT JOIN drivers d ON r.driver_id = d.id
        WHERE e.team_leader_id = $1 
            AND e.role = 'team_member' 
            AND e.is_active = TRUE
        GROUP BY e.id, e.first_name, e.last_name, e.phone, e.email, e.role, e.is_active, e.created_at
        ORDER BY total_registrations DESC, e.first_name ASC
    `;

    console.log(`📊 Executing getTeamLeaderMembers for team_leader_id: ${teamLeaderId}`);
    const result = await pool.query(query, [teamLeaderId]);
    console.log(`📊 Found ${result.rows.length} members for team leader ${teamLeaderId}`);
    
    return result.rows;
};

// ==========================================
// GET MEMBER REGISTRATIONS FOR TEAM LEADER
// ==========================================

const getTeamLeaderMemberRegistrations = async (teamLeaderId, memberId) => {
    const query = `
        SELECT 
            r.id,
            r.car_id,
            r.driver_id,
            r.sales_employee_id,
            r.registration_date,
            r.status,
            r.yango_synced,
            r.created_at,
            r.updated_at,
            -- Car details
            c.id AS car_id,
            c.brand AS car_brand,
            c.model AS car_model,
            c.color AS car_color,
            c.year AS car_year,
            c.license_plate_number AS car_license_plate,
            c.vin AS car_vin,
            c.vehicle_type_id,
            -- Driver details
            d.id AS driver_id,
            d.first_name AS driver_first_name,
            d.last_name AS driver_last_name,
            d.phone AS driver_phone,
            d.email AS driver_email,
            d.license_number AS driver_license_number,
            -- Employee (sales person) details
            e.id AS employee_id,
            e.first_name AS employee_first_name,
            e.last_name AS employee_last_name,
            e.phone AS employee_phone,
            e.email AS employee_email
        FROM registrations r
        INNER JOIN cars c ON r.car_id = c.id
        INNER JOIN drivers d ON r.driver_id = d.id
        INNER JOIN employees e ON r.sales_employee_id = e.id
        WHERE r.sales_employee_id = $1 
            AND e.team_leader_id = $2
            AND e.role = 'team_member'
        ORDER BY r.created_at DESC
    `;

    console.log(`📊 Executing getTeamLeaderMemberRegistrations for member: ${memberId}, team_leader: ${teamLeaderId}`);
    const result = await pool.query(query, [memberId, teamLeaderId]);
    console.log(`📊 Found ${result.rows.length} registrations for member ${memberId}`);
    
    return result.rows;
};

// ==========================================
// GET TEAM LEADER PERFORMANCE SUMMARY
// ==========================================

const getTeamLeaderPerformanceSummary = async (teamLeaderId) => {
    const query = `
        WITH member_stats AS (
            SELECT 
                e.id AS member_id,
                COUNT(r.id) AS registration_count,
                COUNT(DISTINCT r.car_id) AS unique_cars,
                COUNT(DISTINCT r.driver_id) AS unique_drivers
            FROM employees e
            LEFT JOIN registrations r ON r.sales_employee_id = e.id
            WHERE e.team_leader_id = $1 
                AND e.role = 'team_member' 
                AND e.is_active = TRUE
            GROUP BY e.id
        ),
        team_stats AS (
            SELECT 
                COUNT(DISTINCT e.id) AS total_members,
                COALESCE(SUM(ms.registration_count), 0) AS total_registrations,
                COALESCE(AVG(ms.registration_count), 0) AS avg_per_member,
                COALESCE(SUM(ms.unique_cars), 0) AS total_cars_registered,
                COALESCE(SUM(ms.unique_drivers), 0) AS total_drivers_registered,
                COALESCE(MAX(ms.registration_count), 0) AS max_registrations,
                COALESCE(MIN(ms.registration_count), 0) AS min_registrations
            FROM employees e
            LEFT JOIN member_stats ms ON ms.member_id = e.id
            WHERE e.team_leader_id = $1 
                AND e.role = 'team_member' 
                AND e.is_active = TRUE
        )
        SELECT * FROM team_stats
    `;

    console.log(`📊 Executing getTeamLeaderPerformanceSummary for team_leader_id: ${teamLeaderId}`);
    const result = await pool.query(query, [teamLeaderId]);
    console.log(`📊 Team leader summary:`, result.rows[0]);
    
    return result.rows[0];
};

// ==========================================
// GET TEAM LEADER MEMBERS WITH REGISTRATION COUNT
// ==========================================

const getTeamLeaderMembersWithStats = async (teamLeaderId) => {
    const query = `
        SELECT 
            e.id AS member_id,
            e.first_name AS member_first_name,
            e.last_name AS member_last_name,
            e.phone AS member_phone,
            e.email AS member_email,
            e.created_at AS member_since,
            COUNT(r.id) AS total_registrations,
            COUNT(DISTINCT r.car_id) AS unique_cars,
            COUNT(DISTINCT r.driver_id) AS unique_drivers,
            MAX(r.created_at) AS last_registration,
            MIN(r.created_at) AS first_registration
        FROM employees e
        LEFT JOIN registrations r ON r.sales_employee_id = e.id
        WHERE e.team_leader_id = $1 
            AND e.role = 'team_member' 
            AND e.is_active = TRUE
        GROUP BY e.id, e.first_name, e.last_name, e.phone, e.email, e.created_at
        ORDER BY COUNT(r.id) DESC, e.first_name ASC
    `;

    console.log(`📊 Executing getTeamLeaderMembersWithStats for team_leader_id: ${teamLeaderId}`);
    const result = await pool.query(query, [teamLeaderId]);
    console.log(`📊 Found ${result.rows.length} members with stats`);
    
    return result.rows;
};

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
    getTeamLeaderMembersWithStats
};

