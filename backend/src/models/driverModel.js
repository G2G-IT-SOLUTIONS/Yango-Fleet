const pool = require("../config/db");

// ==========================================
// CREATE DRIVER
// ==========================================
const addTwoYears = (date) => {
    if (!date) return null;
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return null;
        d.setFullYear(d.getFullYear() + 2);
        return d.toISOString().split('T')[0];
    } catch (error) {
        return null;
    }
};
const createDriver = async (driver) => {
    // ✅ Validate required fields
    if (!driver.first_name) {
        throw new Error('First name is required');
    }
    if (!driver.last_name) {
        throw new Error('Last name is required');
    }
    if (!driver.license_number) {
        throw new Error('License number is required');
    }
    if (!driver.license_issue_date) {
        throw new Error('License issue date is required');
    }
    if (!driver.birth_date) {
        throw new Error('Birth date is required');
    }

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
            comment,
            work_rule_id,
            yango_driver_id,      
            yango_synced 
        )
        VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $11,
            $12, $13, $14, $15, $16, $17,$18 ,$19
        )
        RETURNING *
    `;

    // ✅ Calculate expiry date from issue date (valid business logic)
    const calculateExpiryDate = (issueDate) => {
        if (!issueDate) return null;
        const d = new Date(issueDate);
        d.setFullYear(d.getFullYear() + 2);
        return d.toISOString().split('T')[0];
    };

    const licenseIssueDate = driver.license_issue_date;
    const licenseExpiryDate = calculateExpiryDate(licenseIssueDate);
    const drivingExperienceSince = driver.driving_experience_since || licenseIssueDate;

    const values = [
        driver.first_name,
        driver.middle_name || '',
        driver.last_name,
        driver.phone || null,
        driver.email || null,
        driver.address || null,
        driver.birth_date,
        driver.license_country || 'eth',
        driver.license_number,
        licenseIssueDate,
        licenseExpiryDate,
        drivingExperienceSince,
        driver.id_document_address || null,
        driver.tax_identification_number || null,
        driver.hire_date || new Date().toISOString().split('T')[0],
        driver.comment || '',
        driver.work_rule_id || null,
        driver.yango_driver_id || null,   
        driver.yango_synced || false  
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
            work_rule_id = COALESCE($17, work_rule_id),
            yango_driver_id = COALESCE($18, yango_driver_id),  
            yango_synced = COALESCE($19, yango_synced),        
            updated_at = NOW()
        WHERE id = $20
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
        driver.work_rule_id || null,
        driver.yango_driver_id || null,  
        driver.yango_synced || false,  
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