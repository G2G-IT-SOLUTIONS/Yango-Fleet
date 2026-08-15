const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const employeeModel = require("../models/employeeModel");

// ==========================================
// HASH PASSWORD
// ==========================================

const hashPassword = async (password) => {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
};

// ==========================================
// VERIFY PASSWORD
// ==========================================

const verifyPassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};

// ==========================================
// GENERATE JWT TOKEN
// ==========================================

const generateToken = (employee) => {
    const payload = {
        id: employee.id,
        email: employee.email,
        phone: employee.phone,
        role: employee.role,
        first_name: employee.first_name,
        last_name: employee.last_name
    };

    return jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRY || '24h' }
    );
};

// ==========================================
//VERIFY JWT TOKEN
// ==========================================

const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return { valid: true, decoded };
    } catch (error) {
        return { valid: false, error: error.message };
    }
};

// ==========================================
// LOGIN EMPLOYEE
// ==========================================

const loginEmployee = async (emailOrPhone, password) => {
    // 1. Find employee by email or phone
    const employee = await employeeModel.findEmployeeByEmailOrPhone(emailOrPhone);

    if (!employee) {
        throw new Error("Invalid credentials");
    }

    // 2. Verify password
    const isValidPassword = await verifyPassword(password, employee.password_hash);

    if (!isValidPassword) {
        throw new Error("Invalid credentials");
    }

    // 3. Check if employee is active
    if (!employee.is_active) {
        throw new Error("Account is deactivated");
    }

    // 4. Generate JWT token
    const token = generateToken(employee);

    // 5. Remove password_hash from employee object
    const { password_hash, ...employeeWithoutPassword } = employee;

    return {
        employee: employeeWithoutPassword,
        token: token
    };
};

// ==========================================
//CHANGE PASSWORD
// ==========================================

const changePassword = async (employeeId, currentPassword, newPassword) => {
    // 1. Get employee with password hash
    const employee = await employeeModel.getEmployeeById(employeeId);

    if (!employee) {
        throw new Error("Employee not found");
    }

    // 2. Get full employee details with password hash
    // Use the existing getEmployeeByEmail function
    const fullEmployee = await employeeModel.getEmployeeByEmail(employee.email);

    if (!fullEmployee || !fullEmployee.password_hash) {
        throw new Error("Employee password not found");
    }

    // 3. Verify current password
    const isValidPassword = await verifyPassword(currentPassword, fullEmployee.password_hash);

    if (!isValidPassword) {
        throw new Error("Current password is incorrect");
    }

    // 4. Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // 5. Update password using your existing function
    const updatedEmployee = await employeeModel.updateEmployeePassword(employeeId, newPasswordHash);

    return updatedEmployee;
};

module.exports = {
    hashPassword,
    verifyPassword,
    generateToken,
    verifyToken,
    loginEmployee,
    changePassword
};