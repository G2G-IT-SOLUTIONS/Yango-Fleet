const bcrypt = require("bcrypt");
const employeeModel = require("../models/employeeModel");

// CREATE EMPLOYEE
const createEmployeeController = async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            phone,
            email,
            password,
            role,
            team_leader_id
        } = req.body;

        // Check required fields
        if (!first_name || !last_name || !phone || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "First name, last name, phone, email and password are required"
            });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 10);

        const employee = await employeeModel.createEmployee({
            first_name,
            last_name,
            phone,
            email,
            password_hash,
            role,
            team_leader_id
        });

        return res.status(201).json({
            success: true,
            message: "Employee created successfully",
            employee
        });
    } catch (error) {
        console.error(error);

        // Duplicate email / phone
        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "Email or phone already exists"
            });
        }

        // Invalid team leader
        if (error.code === "23503") {
            return res.status(400).json({
                success: false,
                message: "Invalid team leader ID"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to create employee",
            error: error.message
        });
    }
};

// GET ALL EMPLOYEES
const getAllEmployeesController = async (req, res) => {
    try {
        const { role, team_leader_id } = req.query;
        
        let employees;
        
        if (role) {
            // Get employees by role
            employees = await employeeModel.getEmployeesByRole(role);
        } else if (team_leader_id) {
            // Get employees under a specific team leader
            employees = await employeeModel.getEmployeesByTeamLeader(team_leader_id);
        } else {
            // Get all employees
            employees = await employeeModel.getAllEmployees();
        }
        
        return res.status(200).json({
            success: true,
            employees: employees || []
        });
    } catch (error) {
        console.error("Error in getAllEmployeesController:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to get employees",
            error: error.message
        });
    }
};

// GET EMPLOYEE BY ID
const getEmployeeByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await employeeModel.getEmployeeById(id);

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        return res.status(200).json({
            success: true,
            employee
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to get employee",
            error: error.message
        });
    }
};

// UPDATE EMPLOYEE
const updateEmployeeController = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            first_name,
            last_name,
            phone,
            email,
            role,
            team_leader_id,
            is_active
        } = req.body;

        // Check if employee exists
        const existingEmployee = await employeeModel.getEmployeeById(id);
        if (!existingEmployee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        const employee = await employeeModel.updateEmployee(
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
        );

        return res.status(200).json({
            success: true,
            message: "Employee updated successfully",
            employee
        });
    } catch (error) {
        console.error(error);

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "Email or phone already exists"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to update employee",
            error: error.message
        });
    }
};

// CHANGE PASSWORD
const updateEmployeePasswordController = async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: "Password is required"
            });
        }

        // Check if employee exists
        const existingEmployee = await employeeModel.getEmployeeById(id);
        if (!existingEmployee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        const password_hash = await bcrypt.hash(password, 10);
        const employee = await employeeModel.updateEmployeePassword(id, password_hash);

        return res.status(200).json({
            success: true,
            message: "Password updated successfully",
            employee
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to update password",
            error: error.message
        });
    }
};

// DELETE EMPLOYEE
const deleteEmployeeController = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if employee exists
        const existingEmployee = await employeeModel.getEmployeeById(id);
        if (!existingEmployee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        const employee = await employeeModel.deleteEmployee(id);

        return res.status(200).json({
            success: true,
            message: "Employee deleted successfully",
            employee
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete employee",
            error: error.message
        });
    }
};

module.exports = {
    createEmployeeController,
    getAllEmployeesController,
    getEmployeeByIdController,
    updateEmployeeController,
    updateEmployeePasswordController,
    deleteEmployeeController
};