const express = require("express");

const {
    createEmployeeController,
    getAllEmployeesController,
    getEmployeeByIdController,
    updateEmployeeController,
    updateEmployeePasswordController,
    deleteEmployeeController
} = require("../controllers/employeeController");

const router = express.Router();


// Create employee
router.post("/", createEmployeeController);

// Get all employees
router.get("/", getAllEmployeesController);

// Get employee by ID
router.get("/:id", getEmployeeByIdController);

// Update employee
router.put("/:id", updateEmployeeController);

// Change employee password
router.patch("/:id/password", updateEmployeePasswordController);

// Delete employee
router.delete("/:id", deleteEmployeeController);

module.exports = router;