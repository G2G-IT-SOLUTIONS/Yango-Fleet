const pool = require("../config/db");

// ==========================================
// CREATE BINDING
// ==========================================

const createBinding = async ({ car_id, driver_id }) => {
    const query = `
        INSERT INTO car_driver_bindings (car_id, driver_id)
        VALUES ($1, $2)
        RETURNING *
    `;

    const result = await pool.query(query, [car_id, driver_id]);
    return result.rows[0];
};

// ==========================================
// GET ACTIVE BINDING BY ID
// ==========================================

const getBindingById = async (id) => {
    const query = `
        SELECT 
            b.*,
            c.brand AS car_brand,
            c.model AS car_model,
            c.license_plate_number,
            c.yango_vehicle_id,
            d.first_name AS driver_first_name,
            d.last_name AS driver_last_name,
            d.phone AS driver_phone,
            d.yango_driver_id,
            
            -- Registration information
            r.sales_employee_id,
            e.first_name AS employee_first_name,
            e.last_name AS employee_last_name,
            e.team_leader_id,
            tl.first_name AS team_leader_first_name,
            tl.last_name AS team_leader_last_name,
            r.registration_date
        FROM car_driver_bindings b
        INNER JOIN cars c ON b.car_id = c.id
        INNER JOIN drivers d ON b.driver_id = d.id
        LEFT JOIN registrations r ON r.car_id = c.id AND r.driver_id = d.id
        LEFT JOIN employees e ON r.sales_employee_id = e.id
        LEFT JOIN employees tl ON e.team_leader_id = tl.id
        WHERE b.id = $1
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0];
};


// GET ACTIVE BINDING BY CAR ID
const getActiveBindingByCarId = async (car_id) => {
    const query = `
        SELECT 
            b.*,
            c.brand AS car_brand,
            c.model AS car_model,
            c.license_plate_number,
            c.yango_vehicle_id,
            d.first_name AS driver_first_name,
            d.last_name AS driver_last_name,
            d.phone AS driver_phone,
            d.yango_driver_id,
            
            -- Registration information
            r.sales_employee_id,
            e.first_name AS employee_first_name,
            e.last_name AS employee_last_name,
            r.registration_date
        FROM car_driver_bindings b
        INNER JOIN cars c ON b.car_id = c.id
        INNER JOIN drivers d ON b.driver_id = d.id
        LEFT JOIN registrations r ON r.car_id = c.id AND r.driver_id = d.id
        LEFT JOIN employees e ON r.sales_employee_id = e.id
        WHERE b.car_id = $1 AND b.is_active = TRUE
    `;

    const result = await pool.query(query, [car_id]);
    return result.rows[0];
};

// GET ACTIVE BINDING BY DRIVER ID
const getActiveBindingByDriverId = async (driver_id) => {
    const query = `
        SELECT 
            b.*,
            c.brand AS car_brand,
            c.model AS car_model,
            c.license_plate_number,
            c.yango_vehicle_id,
            d.first_name AS driver_first_name,
            d.last_name AS driver_last_name,
            d.phone AS driver_phone,
            d.yango_driver_id,
            
            -- Registration information
            r.sales_employee_id,
            e.first_name AS employee_first_name,
            e.last_name AS employee_last_name,
            r.registration_date
        FROM car_driver_bindings b
        INNER JOIN cars c ON b.car_id = c.id
        INNER JOIN drivers d ON b.driver_id = d.id
        LEFT JOIN registrations r ON r.car_id = c.id AND r.driver_id = d.id
        LEFT JOIN employees e ON r.sales_employee_id = e.id
        WHERE b.driver_id = $1 AND b.is_active = TRUE
    `;

    const result = await pool.query(query, [driver_id]);
    return result.rows[0];
};

// ==========================================
// GET ALL BINDINGS
// ==========================================


const getAllBindings = async (filters = {}) => {
    let query = `
        SELECT 
            b.id,
            b.car_id,
            b.driver_id,
            b.bound_at,
            b.unbound_at,
            b.is_active,
            b.yango_synced,
            b.yango_sync_error,
            b.yango_last_synced_at,
            b.created_at,
            
            -- Car information
            c.brand AS car_brand,
            c.model AS car_model,
            c.license_plate_number,
            c.yango_vehicle_id,
            
            -- Driver information
            d.first_name AS driver_first_name,
            d.last_name AS driver_last_name,
            d.phone AS driver_phone,
            d.yango_driver_id,
            
            -- Registration information (who registered it)
            r.sales_employee_id,
            e.first_name AS employee_first_name,
            e.last_name AS employee_last_name,
            e.team_leader_id,
            tl.first_name AS team_leader_first_name,
            tl.last_name AS team_leader_last_name,
            r.registration_date
        FROM car_driver_bindings b
        INNER JOIN cars c ON b.car_id = c.id
        INNER JOIN drivers d ON b.driver_id = d.id
        LEFT JOIN registrations r ON r.car_id = c.id AND r.driver_id = d.id
        LEFT JOIN employees e ON r.sales_employee_id = e.id
        LEFT JOIN employees tl ON e.team_leader_id = tl.id
        WHERE 1=1
    `;

    const values = [];
    let paramCount = 1;

    if (filters.is_active !== undefined) {
        query += ` AND b.is_active = $${paramCount}`;
        values.push(filters.is_active);
        paramCount++;
    }

    if (filters.yango_synced !== undefined) {
        query += ` AND b.yango_synced = $${paramCount}`;
        values.push(filters.yango_synced);
        paramCount++;
    }

    if (filters.car_id) {
        query += ` AND b.car_id = $${paramCount}`;
        values.push(filters.car_id);
        paramCount++;
    }

    if (filters.driver_id) {
        query += ` AND b.driver_id = $${paramCount}`;
        values.push(filters.driver_id);
        paramCount++;
    }

    query += ` ORDER BY b.bound_at DESC`;

    const result = await pool.query(query, values);
    return result.rows;
};

// ==========================================
// UNBIND CAR AND DRIVER
// ==========================================

const unbindCarDriver = async (id) => {
    const query = `
        UPDATE car_driver_bindings
        SET 
            is_active = FALSE,
            unbound_at = NOW(),
            updated_at = NOW()
        WHERE id = $1 AND is_active = TRUE
        RETURNING *
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0];
};

// ==========================================
// UPDATE YANGO INFORMATION
// ==========================================

const updateYangoInfo = async (id, yangoSynced = true, yangoSyncError = null) => {
    const query = `
        UPDATE car_driver_bindings
        SET
            yango_synced = $1,
            yango_sync_error = $2,
            yango_last_synced_at = NOW()
        WHERE id = $3
        RETURNING *
    `;

    const result = await pool.query(query, [yangoSynced, yangoSyncError, id]);
    return result.rows[0];
};

// ==========================================
// UPDATE YANGO ERROR
// ==========================================

const updateYangoError = async (id, errorMessage) => {
    const query = `
        UPDATE car_driver_bindings
        SET
            yango_synced = FALSE,
            yango_sync_error = $1,
            yango_last_synced_at = NOW()
        WHERE id = $2
        RETURNING *
    `;

    const result = await pool.query(query, [errorMessage, id]);
    return result.rows[0];
};

// ==========================================
// DELETE BINDING (Hard delete - use with caution)
// ==========================================

const deleteBinding = async (id) => {
    const query = `DELETE FROM car_driver_bindings WHERE id = $1 RETURNING *`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

module.exports = {
    createBinding,
    getBindingById,
    getActiveBindingByCarId,
    getActiveBindingByDriverId,
    getAllBindings,
    unbindCarDriver,
    updateYangoInfo,
    updateYangoError,
    deleteBinding
};