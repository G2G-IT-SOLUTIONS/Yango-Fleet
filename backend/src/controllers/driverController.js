const driverModel = require("../models/driverModel");
const yangoService = require("../services/yangoService");

// ==========================================
// CREATE DRIVER
// ==========================================

const createDriver = async (req, res) => {
    try {
        const driver = await driverModel.createDriver(req.body);

        res.status(201).json({
            success: true,
            message: "Driver created successfully",
            data: driver
        });
    } catch (error) {
        console.error("Create driver error:", error);

        // Handle duplicate key errors
        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "Duplicate entry - phone, email, or license number already exists",
                error: error.detail
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to create driver",
            error: error.message
        });
    }
};

// ==========================================
// GET ONE DRIVER
// ==========================================

const getDriver = async (req, res) => {
    try {
        const { id } = req.params;
        const driver = await driverModel.getDriverById(id);

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Driver not found"
            });
        }

        res.status(200).json({
            success: true,
            data: driver
        });
    } catch (error) {
        console.error("Get driver error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get driver",
            error: error.message
        });
    }
};

// ==========================================
// GET ALL DRIVERS
// ==========================================

const getDrivers = async (req, res) => {
    try {
        const { yango_synced, search } = req.query;
        const drivers = await driverModel.getAllDrivers({
            yango_synced,
            search
        });

        res.status(200).json({
            success: true,
            count: drivers.length,
            data: drivers
        });
    } catch (error) {
        console.error("Get drivers error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get drivers",
            error: error.message
        });
    }
};

// ==========================================
// UPDATE DRIVER
// ==========================================

const updateDriver = async (req, res) => {
    try {
        const { id } = req.params;

        const existingDriver = await driverModel.getDriverById(id);
        if (!existingDriver) {
            return res.status(404).json({
                success: false,
                message: "Driver not found"
            });
        }

        const driver = await driverModel.updateDriver(id, req.body);

        res.status(200).json({
            success: true,
            message: "Driver updated successfully",
            data: driver
        });
    } catch (error) {
        console.error("Update driver error:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "Duplicate entry - phone, email, or license number already exists",
                error: error.detail
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to update driver",
            error: error.message
        });
    }
};

// ==========================================
// DELETE DRIVER
// ==========================================

const deleteDriver = async (req, res) => {
    try {
        const { id } = req.params;
        const driver = await driverModel.deleteDriver(id);

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Driver not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Driver deleted successfully",
            data: driver
        });
    } catch (error) {
        console.error("Delete driver error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete driver",
            error: error.message
        });
    }
};

// ==========================================
// SYNC DRIVER TO YANGO
// ==========================================

const syncDriverToYango = async (req, res) => {
    try {
        const { id } = req.params;
        const { car_yango_id } = req.body; // Need the Yango car ID to bind

        // 1. Get local driver
        const driver = await driverModel.getDriverById(id);

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Driver not found"
            });
        }

        // 2. Check if already synced
        if (driver.yango_synced && driver.yango_driver_id) {
            return res.status(400).json({
                success: false,
                message: "Driver is already synced with Yango",
                yango_driver_id: driver.yango_driver_id
            });
        }

        // 3. Validate car_yango_id
        if (!car_yango_id) {
            return res.status(400).json({
                success: false,
                message: "car_yango_id is required to sync driver with Yango"
            });
        }

        // 4. Send driver to Yango
        const yangoResponse = await yangoService.createDriverInYango(
            driver,
            car_yango_id
        );

        // 5. Yango returns contractor_profile_id
        const yangoDriverId = yangoResponse.contractor_profile_id;

        if (!yangoDriverId) {
            await driverModel.updateYangoError(
                id,
                "Yango did not return contractor_profile_id"
            );

            return res.status(500).json({
                success: false,
                message: "Yango did not return contractor_profile_id"
            });
        }

        // 6. Save Yango ID locally
        const updatedDriver = await driverModel.updateYangoInfo(
            id,
            yangoDriverId
        );

        // 7. Return result
        res.status(200).json({
            success: true,
            message: "Driver successfully synchronized with Yango",
            data: updatedDriver
        });
    } catch (error) {
        console.error(
            "Yango synchronization error:",
            error.response?.data || error.message
        );

        const { id } = req.params;

        try {
            await driverModel.updateYangoError(
                id,
                error.response?.data?.message || error.message
            );
        } catch (dbError) {
            console.error("Failed to save Yango error:", dbError.message);
        }

        res.status(500).json({
            success: false,
            message: "Failed to synchronize driver with Yango",
            error: error.response?.data || error.message
        });
    }
};

module.exports = {
    createDriver,
    getDriver,
    getDrivers,
    updateDriver,
    deleteDriver,
    syncDriverToYango
};