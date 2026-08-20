// const pool = require("../config/db");

// // ==========================================
// // CREATE REGISTRATION
// // ==========================================

// const createRegistration = async ({ car_id, driver_id, sales_employee_id, status = 'pending' }) => {
//     const query = `
//         INSERT INTO registrations (
//             car_id,
//             driver_id,
//             sales_employee_id,
//             status
//         )
//         VALUES ($1, $2, $3, $4)
//         RETURNING *
//     `;

//     const result = await pool.query(query, [car_id, driver_id, sales_employee_id, status]);
//     return result.rows[0];
// };

// // ==========================================
// // GET REGISTRATION BY ID
// // ==========================================

// const getRegistrationById = async (id) => {
//     const query = `
//         SELECT 
//             r.id,
//             r.registration_date,
//             r.status,
//             r.yango_synced,
//             r.yango_sync_error,
//             r.yango_synced_at,
//             r.created_at,
//             -- Car details
//             c.id AS car_id,
//             c.brand,
//             c.model,
//             c.color,
//             c.year,
//             c.license_plate_number,
//             c.yango_vehicle_id,
//             c.yango_synced AS car_yango_synced,
//             -- Driver details
//             d.id AS driver_id,
//             d.first_name AS driver_first_name,
//             d.middle_name AS driver_middle_name,
//             d.last_name AS driver_last_name,
//             d.phone AS driver_phone,
//             d.license_number,
//             d.yango_driver_id,
//             d.yango_synced AS driver_yango_synced,
//             -- Employee details
//             e.id AS employee_id,
//             e.first_name AS employee_first_name,
//             e.last_name AS employee_last_name,
//             e.role AS employee_role,
//             -- Binding details
//             b.id AS binding_id,
//             b.is_active AS binding_active,
//             b.yango_synced AS binding_yango_synced
//         FROM registrations r
//         INNER JOIN cars c ON r.car_id = c.id
//         INNER JOIN drivers d ON r.driver_id = d.id
//         INNER JOIN employees e ON r.sales_employee_id = e.id
//         LEFT JOIN car_driver_bindings b ON b.car_id = c.id AND b.driver_id = d.id AND b.is_active = TRUE
//         WHERE r.id = $1
//     `;

//     const result = await pool.query(query, [id]);
//     return result.rows[0];
// };

// // ==========================================
// // GET ALL REGISTRATIONS
// // ==========================================

// const getAllRegistrations = async (filters = {}) => {
//     let query = `
//         SELECT 
//             r.id,
//             r.registration_date,
//             r.status,
//             r.yango_synced,
//             r.created_at,
//             c.id AS car_id,
//             c.brand,
//             c.model,
//             c.license_plate_number,
//             c.yango_vehicle_id,
//             d.id AS driver_id,
//             d.first_name AS driver_first_name,
//             d.last_name AS driver_last_name,
//             d.phone AS driver_phone,
//             d.yango_driver_id,
//             e.id AS employee_id,
//             e.first_name AS employee_first_name,
//             e.last_name AS employee_last_name,
//             e.role AS employee_role,
//             b.id AS binding_id,
//             b.is_active AS binding_active
//         FROM registrations r
//         INNER JOIN cars c ON r.car_id = c.id
//         INNER JOIN drivers d ON r.driver_id = d.id
//         INNER JOIN employees e ON r.sales_employee_id = e.id
//         LEFT JOIN car_driver_bindings b ON b.car_id = c.id AND b.driver_id = d.id AND b.is_active = TRUE
//         WHERE 1=1
//     `;

//     const values = [];
//     let paramCount = 1;

//     if (filters.status) {
//         query += ` AND r.status = $${paramCount}`;
//         values.push(filters.status);
//         paramCount++;
//     }

//     if (filters.employee_id) {
//         query += ` AND r.sales_employee_id = $${paramCount}`;
//         values.push(filters.employee_id);
//         paramCount++;
//     }

//     if (filters.car_id) {
//         query += ` AND r.car_id = $${paramCount}`;
//         values.push(filters.car_id);
//         paramCount++;
//     }

//     if (filters.driver_id) {
//         query += ` AND r.driver_id = $${paramCount}`;
//         values.push(filters.driver_id);
//         paramCount++;
//     }

//     if (filters.yango_synced !== undefined) {
//         query += ` AND r.yango_synced = $${paramCount}`;
//         values.push(filters.yango_synced);
//         paramCount++;
//     }

//     query += ` ORDER BY r.created_at DESC`;

//     const result = await pool.query(query, values);
//     return result.rows;
// };

// // ==========================================
// // UPDATE REGISTRATION STATUS
// // ================
// // 
// // 
// // ==========================

// const updateRegistrationStatus = async (id, status) => {
//     const query = `
//         UPDATE registrations
//         SET 
//             status = $1,
//             updated_at = NOW()
//         WHERE id = $2
//         RETURNING *
//     `;

//     const result = await pool.query(query, [status, id]);
//     return result.rows[0];
// };

// // ==========================================
// // UPDATE YANGO SYNC STATUS
// // ==========================================

// const updateYangoSyncStatus = async (id, synced, error = null) => {
//     const query = `
//         UPDATE registrations
//         SET 
//             yango_synced = $1,
//             yango_sync_error = $2,
//             yango_synced_at = CASE WHEN $1 = TRUE THEN NOW() ELSE NULL END,
//             updated_at = NOW()
//         WHERE id = $3
//         RETURNING *
//     `;

//     const result = await pool.query(query, [synced, error, id]);
//     return result.rows[0];
// };

// // ==========================================
// // DELETE REGISTRATION
// // ==========================================

// const deleteRegistration = async (id) => {
//     const query = `DELETE FROM registrations WHERE id = $1 RETURNING *`;
//     const result = await pool.query(query, [id]);
//     return result.rows[0];
// };

// module.exports = {
//     createRegistration,
//     getRegistrationById,
//     getAllRegistrations,
//     updateRegistrationStatus,
//     updateYangoSyncStatus,
//     getRegistrationByDriverId,
//     updateRegistration, 
//     deleteRegistration
// };


const pool = require("../config/db");

// ==========================================
// CREATE REGISTRATION
// ==========================================

const createRegistration = async ({ car_id, driver_id, sales_employee_id, status = 'pending' }) => {
    const query = `
        INSERT INTO registrations (
            car_id,
            driver_id,
            sales_employee_id,
            status
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *
    `;

    const result = await pool.query(query, [car_id, driver_id, sales_employee_id, status]);
    return result.rows[0];
};

// ==========================================
// GET REGISTRATION BY ID
// ==========================================

const getRegistrationById = async (id) => {
    const query = `
        SELECT 
            r.id,
            r.registration_date,
            r.status,
            r.yango_synced,
            r.yango_sync_error,
            r.yango_synced_at,
            r.created_at,
            c.id AS car_id,
            c.brand,
            c.model,
            c.color,
            c.year,
            c.license_plate_number,
            c.yango_vehicle_id,
            c.yango_synced AS car_yango_synced,
            d.id AS driver_id,
            d.first_name AS driver_first_name,
            d.middle_name AS driver_middle_name,
            d.last_name AS driver_last_name,
            d.phone AS driver_phone,
            d.license_number,
            d.yango_driver_id,
            d.yango_synced AS driver_yango_synced,
            e.id AS employee_id,
            e.first_name AS employee_first_name,
            e.last_name AS employee_last_name,
            e.role AS employee_role,
            b.id AS binding_id,
            b.is_active AS binding_active,
            b.yango_synced AS binding_yango_synced
        FROM registrations r
        INNER JOIN cars c ON r.car_id = c.id
        INNER JOIN drivers d ON r.driver_id = d.id
        INNER JOIN employees e ON r.sales_employee_id = e.id
        LEFT JOIN car_driver_bindings b ON b.car_id = c.id AND b.driver_id = d.id AND b.is_active = TRUE
        WHERE r.id = $1
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0];
};

// ==========================================
// GET REGISTRATION BY DRIVER ID
// ==========================================

const getRegistrationByDriverId = async (driverId) => {
    const query = `
        SELECT * FROM registrations 
        WHERE driver_id = $1 
        ORDER BY created_at DESC 
        LIMIT 1
    `;
    const result = await pool.query(query, [driverId]);
    return result.rows[0];
};

// ==========================================
// UPDATE REGISTRATION
// ==========================================

const updateRegistration = async ({ id, car_id, driver_id, status }) => {
    const query = `
        UPDATE registrations
        SET 
            car_id = COALESCE($1, car_id),
            driver_id = COALESCE($2, driver_id),
            status = COALESCE($3, status),
            updated_at = NOW()
        WHERE id = $4
        RETURNING *
    `;
    const result = await pool.query(query, [car_id, driver_id, status, id]);
    return result.rows[0];
};

// ==========================================
// GET ALL REGISTRATIONS
// ==========================================

const getAllRegistrations = async (filters = {}) => {
    let query = `
        SELECT 
            r.id,
            r.registration_date,
            r.status,
            r.yango_synced,
            r.created_at,
            c.id AS car_id,
            c.brand,
            c.model,
            c.license_plate_number,
            c.yango_vehicle_id,
            d.id AS driver_id,
            d.first_name AS driver_first_name,
            d.last_name AS driver_last_name,
            d.phone AS driver_phone,
            d.yango_driver_id,
            e.id AS employee_id,
            e.first_name AS employee_first_name,
            e.last_name AS employee_last_name,
            e.role AS employee_role,
            b.id AS binding_id,
            b.is_active AS binding_active
        FROM registrations r
        INNER JOIN cars c ON r.car_id = c.id
        INNER JOIN drivers d ON r.driver_id = d.id
        INNER JOIN employees e ON r.sales_employee_id = e.id
        LEFT JOIN car_driver_bindings b ON b.car_id = c.id AND b.driver_id = d.id AND b.is_active = TRUE
        WHERE 1=1
    `;

    const values = [];
    let paramCount = 1;

    if (filters.status) {
        query += ` AND r.status = $${paramCount}`;
        values.push(filters.status);
        paramCount++;
    }

    if (filters.employee_id) {
        query += ` AND r.sales_employee_id = $${paramCount}`;
        values.push(filters.employee_id);
        paramCount++;
    }

    if (filters.car_id) {
        query += ` AND r.car_id = $${paramCount}`;
        values.push(filters.car_id);
        paramCount++;
    }

    if (filters.driver_id) {
        query += ` AND r.driver_id = $${paramCount}`;
        values.push(filters.driver_id);
        paramCount++;
    }

    if (filters.yango_synced !== undefined) {
        query += ` AND r.yango_synced = $${paramCount}`;
        values.push(filters.yango_synced);
        paramCount++;
    }

    query += ` ORDER BY r.created_at DESC`;

    const result = await pool.query(query, values);
    return result.rows;
};

// ==========================================
// UPDATE REGISTRATION STATUS
// ==========================================

const updateRegistrationStatus = async (id, status) => {
    const query = `
        UPDATE registrations
        SET 
            status = $1,
            updated_at = NOW()
        WHERE id = $2
        RETURNING *
    `;

    const result = await pool.query(query, [status, id]);
    return result.rows[0];
};

// ==========================================
// UPDATE YANGO SYNC STATUS
// ==========================================

const updateYangoSyncStatus = async (id, synced, error = null) => {
    const query = `
        UPDATE registrations
        SET 
            yango_synced = $1,
            yango_sync_error = $2,
            yango_synced_at = CASE WHEN $1 = TRUE THEN NOW() ELSE NULL END,
            updated_at = NOW()
        WHERE id = $3
        RETURNING *
    `;

    const result = await pool.query(query, [synced, error, id]);
    return result.rows[0];
};

// ==========================================
// DELETE REGISTRATION
// ==========================================

const deleteRegistration = async (id) => {
    const query = `DELETE FROM registrations WHERE id = $1 RETURNING *`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

// ==========================================
// EXPORT ALL FUNCTIONS
// ==========================================
module.exports = {
    createRegistration,
    getRegistrationById,
    getRegistrationByDriverId,
    getAllRegistrations,
    updateRegistration,
    updateRegistrationStatus,
    updateYangoSyncStatus,
    deleteRegistration
};