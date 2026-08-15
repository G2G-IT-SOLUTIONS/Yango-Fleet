const pool = require("../config/db");

// ==========================================
// CREATE DRIVER
// ==========================================

const createDriver = async (driver) => {
    const query = `
        INSERT INTO drivers (
            first_name,
            middle_name,
            last_name,
            phone,
            email,
            address,
            birth_date,
            license_country,
            license_number,
            license_issue_date,
            license_expiry_date,
            driving_experience_since,
            id_document_address,
            tax_identification_number,
            hire_date,
            comment
        )
        VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $11,
            $12, $13, $14, $15, $16
        )
        RETURNING *
    `;

    const values = [
         // String fields
        driver.first_name || 'Unknown',
        driver.middle_name || '',
        driver.last_name || 'Unknown',
        driver.phone || '+251900000000',
        driver.email || null,
        driver.address || 'No address provided',
        
        // Date fields in YYYY-MM-DD format
        driver.birth_date || '1990-05-19',              // Born May 19, 1990
        driver.license_country || 'eth',
        driver.license_number || 'N/A',
        driver.license_issue_date || '2015-05-19',      // License issued May 19, 2015
        driver.license_expiry_date || '2030-05-19',     // License expires May 19, 2030
        driver.driving_experience_since || '2010-05-19',// Driving since May 19, 2010
        driver.id_document_address || 'No address provided',
        driver.tax_identification_number || 'N/A',
        driver.hire_date || '2023-05-19',               // Hired May 19, 2023
        driver.comment || ''
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
};

// ==========================================
// GET ONE DRIVER
// ==========================================

const getDriverById = async (id) => {
    const query = `SELECT * FROM drivers WHERE id = $1`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

// ==========================================
// GET DRIVER BY YANGO ID
// ==========================================

const getDriverByYangoId = async (yangoDriverId) => {
    const query = `SELECT * FROM drivers WHERE yango_driver_id = $1`;
    const result = await pool.query(query, [yangoDriverId]);
    return result.rows[0];
};

// ==========================================
// GET ALL DRIVERS
// ==========================================

const getAllDrivers = async (filters = {}) => {
    let query = `
        SELECT *
        FROM drivers
        WHERE 1=1
    `;

    const values = [];
    let paramCount = 1;

    if (filters.yango_synced !== undefined) {
        query += ` AND yango_synced = $${paramCount}`;
        values.push(filters.yango_synced);
        paramCount++;
    }

    if (filters.search) {
        query += ` AND (
            first_name ILIKE $${paramCount} OR 
            last_name ILIKE $${paramCount} OR 
            phone ILIKE $${paramCount} OR 
            email ILIKE $${paramCount}
        )`;
        values.push(`%${filters.search}%`);
        paramCount++;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, values);
    return result.rows;
};

// ==========================================
// UPDATE DRIVER
// ==========================================

const updateDriver = async (id, driver) => {
    const query = `
        UPDATE drivers
        SET
            first_name = COALESCE($1, first_name),
            middle_name = COALESCE($2, middle_name),
            last_name = COALESCE($3, last_name),
            phone = COALESCE($4, phone),
            email = COALESCE($5, email),
            address = COALESCE($6, address),
            birth_date = COALESCE($7, birth_date),
            license_country = COALESCE($8, license_country),
            license_number = COALESCE($9, license_number),
            license_issue_date = COALESCE($10, license_issue_date),
            license_expiry_date = COALESCE($11, license_expiry_date),
            driving_experience_since = COALESCE($12, driving_experience_since),
            id_document_address = COALESCE($13, id_document_address),
            tax_identification_number = COALESCE($14, tax_identification_number),
            hire_date = COALESCE($15, hire_date),
            comment = COALESCE($16, comment),
            updated_at = NOW()
        WHERE id = $17
        RETURNING *
    `;

    const values = [
        driver.first_name || null,
        driver.middle_name || null,
        driver.last_name || null,
        driver.phone || null,
        driver.email || null,
        driver.address || null,
        driver.birth_date || null,
        driver.license_country || null,
        driver.license_number || null,
        driver.license_issue_date || null,
        driver.license_expiry_date || null,
        driver.driving_experience_since || null,
        driver.id_document_address || null,
        driver.tax_identification_number || null,
        driver.hire_date || null,
        driver.comment || null,
        id
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
};

// ==========================================
// DELETE DRIVER
// ==========================================

const deleteDriver = async (id) => {
    const query = `DELETE FROM drivers WHERE id = $1 RETURNING *`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

// ==========================================
// UPDATE YANGO INFORMATION
// ==========================================

const updateYangoInfo = async (id, yangoDriverId) => {
    const query = `
        UPDATE drivers
        SET
            yango_driver_id = $1,
            yango_synced = TRUE,
            yango_sync_error = NULL,
            yango_last_synced_at = NOW(),
            updated_at = NOW()
        WHERE id = $2
        RETURNING *
    `;

    const result = await pool.query(query, [yangoDriverId, id]);
    return result.rows[0];
};

// ==========================================
// SAVE YANGO ERROR
// ==========================================

const updateYangoError = async (id, errorMessage) => {
    const query = `
        UPDATE drivers
        SET
            yango_synced = FALSE,
            yango_sync_error = $1,
            updated_at = NOW()
        WHERE id = $2
        RETURNING *
    `;

    const result = await pool.query(query, [errorMessage, id]);
    return result.rows[0];
};

module.exports = {
    createDriver,
    getDriverById,
    getDriverByYangoId,
    getAllDrivers,
    updateDriver,
    deleteDriver,
    updateYangoInfo,
    updateYangoError
};