const authService = require("../services/authService");
const employeeModel = require("../models/employeeModel");

// ==========================================
// LOGIN EMPLOYEE
// ==========================================

const login = async (req, res) => {
    try {
        const { emailOrPhone, password } = req.body;

        if (!emailOrPhone || !password) {
            return res.status(400).json({
                success: false,
                message: "Email/Phone and password are required"
            });
        }

        const result = await authService.loginEmployee(emailOrPhone, password);

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                employee: result.employee,
                token: result.token
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        if (error.message === "Invalid credentials") {
            return res.status(401).json({
                success: false,
                message: "Invalid email/phone or password"
            });
        }

        if (error.message === "Account is deactivated") {
            return res.status(403).json({
                success: false,
                message: "Account is deactivated. Please contact administrator."
            });
        }

        res.status(500).json({
            success: false,
            message: "Login failed",
            error: error.message
        });
    }
};

// ==========================================
// LOGOUT
// ==========================================

const logout = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({
            success: false,
            message: "Logout failed",
            error: error.message
        });
    }
};

// ==========================================
// GET CURRENT EMPLOYEE PROFILE
// ==========================================

const getCurrentEmployee = async (req, res) => {
    try {
        const employeeId = req.employeeId;
        const employee = await employeeModel.getEmployeeById(employeeId);

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        res.status(200).json({
            success: true,
            data: employee
        });

    } catch (error) {
        console.error("Get current employee error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get employee profile",
            error: error.message
        });
    }
};

// ==========================================
// CHANGE PASSWORD
// ==========================================

const changePassword = async (req, res) => {
    try {
        const employeeId = req.employeeId;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Current password and new password are required"
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 6 characters long"
            });
        }

        const updatedEmployee = await authService.changePassword(
            employeeId,
            currentPassword,
            newPassword
        );

        res.status(200).json({
            success: true,
            message: "Password changed successfully. Please login again.",
            data: updatedEmployee
        });

    } catch (error) {
        console.error("Change password error:", error);

        if (error.message === "Current password is incorrect") {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect"
            });
        }

        if (error.message === "Employee not found") {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to change password",
            error: error.message
        });
    }
};

module.exports = {
    login,
    logout,
    getCurrentEmployee,
    changePassword
};