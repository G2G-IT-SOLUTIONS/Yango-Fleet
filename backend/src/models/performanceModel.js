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