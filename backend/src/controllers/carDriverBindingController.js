const bindingModel = require("../models/carDriverBindingModel");
const carModel = require("../models/carModel");
const driverModel = require("../models/driverModel");
const yangoService = require("../services/yangoService");

// ==========================================
// CREATE BINDING
// ==========================================

const createBinding = async (req, res) => {
    try {
        const { car_id, driver_id } = req.body;

        // Validate required fields
        if (!car_id || !driver_id) {
            return res.status(400).json({
                success: false,
                message: "car_id and driver_id are required"
            });
        }

        // Check if car exists
        const car = await carModel.getCarById(car_id);
        if (!car) {
            return res.status(404).json({
                success: false,
                message: "Car not found"
            });
        }

        // Check if driver exists
        const driver = await driverModel.getDriverById(driver_id);
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Driver not found"
            });
        }

        // Check if car already has an active binding
        const existingCarBinding = await bindingModel.getActiveBindingByCarId(car_id);
        if (existingCarBinding) {
            return res.status(409).json({
                success: false,
                message: "Car already has an active binding",
                data: existingCarBinding
            });
        }

        // Check if driver already has an active binding
        const existingDriverBinding = await bindingModel.getActiveBindingByDriverId(driver_id);
        if (existingDriverBinding) {
            return res.status(409).json({
                success: false,
                message: "Driver already has an active binding",
                data: existingDriverBinding
            });
        }

        // Create binding locally
        const binding = await bindingModel.createBinding({ car_id, driver_id });

        // Try to sync with Yango if both have Yango IDs
        let yangoSuccess = false;
        let yangoError = null;

        if (car.yango_synced && driver.yango_synced) {
            try {
                await yangoService.bindCarToDriverInYango(
                    car.yango_vehicle_id,
                    driver.yango_driver_id
                );
                
                // Update binding with Yango sync status
                await bindingModel.updateYangoInfo(binding.id, true);
                yangoSuccess = true;
            } catch (error) {
                console.error("Yango binding error:", error.message);
                yangoError = error.message;
                await bindingModel.updateYangoError(binding.id, error.message);
            }
        } else {
            const errorMsg = "Car or driver not synced with Yango yet";
            await bindingModel.updateYangoError(binding.id, errorMsg);
            yangoError = errorMsg;
        }

        // Get the updated binding with details
        const updatedBinding = await bindingModel.getBindingById(binding.id);

        res.status(201).json({
            success: true,
            message: yangoSuccess 
                ? "Binding created and synced with Yango successfully" 
                : "Binding created locally but Yango sync failed",
            data: updatedBinding,
            yango_synced: yangoSuccess,
            yango_error: yangoError
        });

    } catch (error) {
        console.error("Create binding error:", error);

        // Handle duplicate key errors from unique constraints
        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "Duplicate binding - car or driver already has an active binding",
                error: error.detail
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to create binding",
            error: error.message
        });
    }
};

// ==========================================
// GET BINDING BY ID
// ==========================================

const getBinding = async (req, res) => {
    try {
        const { id } = req.params;
        const binding = await bindingModel.getBindingById(id);

        if (!binding) {
            return res.status(404).json({
                success: false,
                message: "Binding not found"
            });
        }

        res.status(200).json({
            success: true,
            data: binding
        });
    } catch (error) {
        console.error("Get binding error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get binding",
            error: error.message
        });
    }
};

// ==========================================
// GET ALL BINDINGS
// ==========================================

const getBindings = async (req, res) => {
    try {
        const { is_active, yango_synced, car_id, driver_id } = req.query;
        const bindings = await bindingModel.getAllBindings({
            is_active,
            yango_synced,
            car_id,
            driver_id
        });

        res.status(200).json({
            success: true,
            count: bindings.length,
            data: bindings
        });
    } catch (error) {
        console.error("Get bindings error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get bindings",
            error: error.message
        });
    }
};

// ==========================================
// GET ACTIVE BINDING BY CAR
// ==========================================

const getActiveBindingByCar = async (req, res) => {
    try {
        const { car_id } = req.params;
        const binding = await bindingModel.getActiveBindingByCarId(car_id);

        if (!binding) {
            return res.status(404).json({
                success: false,
                message: "No active binding found for this car"
            });
        }

        res.status(200).json({
            success: true,
            data: binding
        });
    } catch (error) {
        console.error("Get car binding error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get car binding",
            error: error.message
        });
    }
};

// ==========================================
// GET ACTIVE BINDING BY DRIVER
// ==========================================

const getActiveBindingByDriver = async (req, res) => {
    try {
        const { driver_id } = req.params;
        const binding = await bindingModel.getActiveBindingByDriverId(driver_id);

        if (!binding) {
            return res.status(404).json({
                success: false,
                message: "No active binding found for this driver"
            });
        }

        res.status(200).json({
            success: true,
            data: binding
        });
    } catch (error) {
        console.error("Get driver binding error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get driver binding",
            error: error.message
        });
    }
};

// ==========================================
// UNBIND CAR AND DRIVER
// ==========================================

const unbindCarDriver = async (req, res) => {
    try {
        const { id } = req.params;

        // Get the binding first
        const binding = await bindingModel.getBindingById(id);
        if (!binding) {
            return res.status(404).json({
                success: false,
                message: "Binding not found"
            });
        }

        if (!binding.is_active) {
            return res.status(400).json({
                success: false,
                message: "Binding is already inactive"
            });
        }

        // Get car and driver details for Yango unbinding
        const car = await carModel.getCarById(binding.car_id);
        const driver = await driverModel.getDriverById(binding.driver_id);

        // Unbind locally
        const unboundBinding = await bindingModel.unbindCarDriver(id);

        // Try to unbind from Yango if synced
        let yangoSuccess = false;
        let yangoError = null;

        if (binding.yango_synced && car.yango_synced && driver.yango_synced) {
            try {
                await yangoService.unbindCarFromDriverInYango(
                    car.yango_vehicle_id,
                    driver.yango_driver_id
                );
                yangoSuccess = true;
            } catch (error) {
                console.error("Yango unbinding error:", error.message);
                yangoError = error.message;
            }
        }

        res.status(200).json({
            success: true,
            message: yangoSuccess 
                ? "Unbound successfully and synced with Yango" 
                : "Unbound locally but Yango sync failed",
            data: unboundBinding,
            yango_synced: yangoSuccess,
            yango_error: yangoError
        });

    } catch (error) {
        console.error("Unbind error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to unbind car and driver",
            error: error.message
        });
    }
};

// ==========================================
// SYNC BINDING TO YANGO
// ==========================================

const syncBindingToYango = async (req, res) => {
    try {
        const { id } = req.params;

        // Get binding with details
        const binding = await bindingModel.getBindingById(id);
        if (!binding) {
            return res.status(404).json({
                success: false,
                message: "Binding not found"
            });
        }

        if (!binding.is_active) {
            return res.status(400).json({
                success: false,
                message: "Cannot sync inactive binding"
            });
        }

        if (binding.yango_synced) {
            return res.status(400).json({
                success: false,
                message: "Binding is already synced with Yango"
            });
        }

        // Get car and driver
        const car = await carModel.getCarById(binding.car_id);
        const driver = await driverModel.getDriverById(binding.driver_id);

        if (!car.yango_synced) {
            return res.status(400).json({
                success: false,
                message: "Car is not synced with Yango. Please sync car first."
            });
        }

        if (!driver.yango_synced) {
            return res.status(400).json({
                success: false,
                message: "Driver is not synced with Yango. Please sync driver first."
            });
        }

        // Send to Yango
        try {
            await yangoService.bindCarToDriverInYango(
                car.yango_vehicle_id,
                driver.yango_driver_id
            );
            
            // Update binding with Yango sync status
            const updatedBinding = await bindingModel.updateYangoInfo(id, true);
            
            res.status(200).json({
                success: true,
                message: "Binding successfully synced with Yango",
                data: updatedBinding
            });
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message;
            await bindingModel.updateYangoError(id, errorMsg);
            
            res.status(500).json({
                success: false,
                message: "Failed to sync binding with Yango",
                error: errorMsg
            });
        }

    } catch (error) {
        console.error("Sync binding error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to sync binding with Yango",
            error: error.message
        });
    }
};

module.exports = {
    createBinding,
    getBinding,
    getBindings,
    getActiveBindingByCar,
    getActiveBindingByDriver,
    unbindCarDriver,
    syncBindingToYango
};