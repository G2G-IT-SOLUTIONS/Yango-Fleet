const pool = require("../config/db");


// CREATE EMPLOYEE
const createEmployee = async ({
    first_name,
    last_name,
    phone,
    email,
    password_hash,
    role,
    team_leader_id
}) => {

    const query = `
        INSERT INTO employees (
            first_name,
            last_name,
            phone,
            email,
            password_hash,
            role,
            team_leader_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING
            id,
            first_name,
            last_name,
            phone,
            email,
            role,
            team_leader_id,
            is_active,
            created_at;
    `;

    const values = [
        first_name,
        last_name,
        phone,
        email,
        password_hash,
        role || "team_member",
        team_leader_id || null
    ];

    const result = await pool.query(query, values);

    return result.rows[0];
};

//Find Employee by email/phone

const findEmployeeByEmailOrPhone = async (emailOrPhone) => {
    const query = `
        SELECT 
            id, 
            first_name, 
            last_name, 
            phone, 
            email, 
            password_hash,
            role, 
            team_leader_id, 
            is_active,
            created_at
        FROM employees
        WHERE (email = $1 OR phone = $1)
        AND is_active = TRUE
    `;

    const result = await pool.query(query, [emailOrPhone]);
    return result.rows[0];
};

// GET ALL EMPLOYEES
const getAllEmployees = async () => {

    const query = `
        SELECT
            e.id,
            e.first_name,
            e.last_name,
            e.phone,
            e.email,
            e.role,
            e.team_leader_id,
            e.is_active,
            e.created_at,

            tl.first_name AS team_leader_first_name,
            tl.last_name AS team_leader_last_name

        FROM employees e

        LEFT JOIN employees tl
            ON e.team_leader_id = tl.id

        ORDER BY e.created_at DESC;
    `;

    const result = await pool.query(query);

    return result.rows;
};


// GET EMPLOYEE BY ID
const getEmployeeById = async (id) => {

    const query = `
        SELECT
            e.id,
            e.first_name,
            e.last_name,
            e.phone,
            e.email,
            e.role,
            e.team_leader_id,
            e.is_active,
            e.created_at,

            tl.first_name AS team_leader_first_name,
            tl.last_name AS team_leader_last_name

        FROM employees e

        LEFT JOIN employees tl
            ON e.team_leader_id = tl.id

        WHERE e.id = $1;
    `;

    const result = await pool.query(query, [id]);

    return result.rows[0];
};


// GET EMPLOYEE BY EMAIL
// Used mainly for login
const getEmployeeByEmail = async (email) => {

    const query = `
        SELECT *
        FROM employees
        WHERE email = $1;
    `;

    const result = await pool.query(query, [email]);

    return result.rows[0];
};


// UPDATE EMPLOYEE

const updateEmployee = async (
    id,
    {
        first_name,
        last_name,
        phone,
        email,
        role,
        team_leader_id,
        is_active
    }
) => {
    // Build the query dynamically based on provided fields
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (first_name !== undefined) {
        updates.push(`first_name = $${paramCount}`);
        values.push(first_name);
        paramCount++;
    }
    if (last_name !== undefined) {
        updates.push(`last_name = $${paramCount}`);
        values.push(last_name);
        paramCount++;
    }
    if (phone !== undefined) {
        updates.push(`phone = $${paramCount}`);
        values.push(phone);
        paramCount++;
    }
    if (email !== undefined) {
        updates.push(`email = $${paramCount}`);
        values.push(email);
        paramCount++;
    }
    if (role !== undefined) {
        updates.push(`role = $${paramCount}`);
        values.push(role);
        paramCount++;
    }
    if (team_leader_id !== undefined) {
        updates.push(`team_leader_id = $${paramCount}`);
        values.push(team_leader_id);
        paramCount++;
    }
    if (is_active !== undefined) {
        updates.push(`is_active = $${paramCount}`);
        values.push(is_active);
        paramCount++;
    }

    // If no fields to update, return existing employee
    if (updates.length === 0) {
        const result = await pool.query(
            `SELECT * FROM employees WHERE id = $1`,
            [id]
        );
        return result.rows[0];
    }

    values.push(id);
    const query = `
        UPDATE employees
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING
            id,
            first_name,
            last_name,
            phone,
            email,
            role,
            team_leader_id,
            is_active,
            created_at;
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
};
// GET EMPLOYEES BY ROLE
const getEmployeesByRole = async (role) => {
    const query = `
        SELECT
            e.id,
            e.first_name,
            e.last_name,
            e.phone,
            e.email,
            e.role,
            e.team_leader_id,
            e.is_active,
            e.created_at,
            tl.first_name AS team_leader_first_name,
            tl.last_name AS team_leader_last_name,
            (SELECT COUNT(*) FROM registrations WHERE sales_employee_id = e.id) AS registration_count
        FROM employees e
        LEFT JOIN employees tl ON e.team_leader_id = tl.id
        WHERE e.role = $1
        ORDER BY e.created_at DESC;
    `;

    const result = await pool.query(query, [role]);
    return result.rows;
};

// GET EMPLOYEES BY TEAM LEADER
const getEmployeesByTeamLeader = async (team_leader_id) => {
    const query = `
        SELECT
            e.id,
            e.first_name,
            e.last_name,
            e.phone,
            e.email,
            e.role,
            e.team_leader_id,
            e.is_active,
            e.created_at,
            tl.first_name AS team_leader_first_name,
            tl.last_name AS team_leader_last_name,
            (SELECT COUNT(*) FROM registrations WHERE sales_employee_id = e.id) AS registration_count
        FROM employees e
        LEFT JOIN employees tl ON e.team_leader_id = tl.id
        WHERE e.team_leader_id = $1
        ORDER BY e.created_at DESC;
    `;

    const result = await pool.query(query, [team_leader_id]);
    return result.rows;
};

// UPDATE PASSWORD
const updateEmployeePassword = async (
    id,
    password_hash
) => {

    const query = `
        UPDATE employees
        SET password_hash = $1

        WHERE id = $2

        RETURNING
            id,
            first_name,
            last_name,
            email;
    `;

    const result = await pool.query(query, [
        password_hash,
        id
    ]);

    return result.rows[0];
};


// DELETE EMPLOYEE
const deleteEmployee = async (id) => {

    const query = `
        DELETE FROM employees
        WHERE id = $1

        RETURNING id;
    `;

    const result = await pool.query(query, [id]);

    return result.rows[0];
};


module.exports = {
    createEmployee,
    findEmployeeByEmailOrPhone, 
    getAllEmployees,
    getEmployeeById,
    getEmployeesByRole,        
    getEmployeesByTeamLeader,
    getEmployeeByEmail,
    updateEmployee,
    updateEmployeePassword,
    deleteEmployee
};