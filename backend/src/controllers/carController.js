const carModel = require("../models/carModel");
const yangoService = require("../services/yangoService");


// ============================
// CREATE CAR
// ============================

const createCar = async (req, res) => {
    try {

        const car = await carModel.createCar(req.body);

        res.status(201).json({
            success: true,
            message: "Car created successfully",
            data: car
        });

    } catch (error) {

        console.error("Create car error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create car",
            error: error.message
        });
    }
};


// ============================
// GET ONE CAR
// ============================

const getCar = async (req, res) => {
    try {

        const { id } = req.params;

        const car = await carModel.getCarById(id);

        if (!car) {
            return res.status(404).json({
                success: false,
                message: "Car not found"
            });
        }

        res.status(200).json({
            success: true,
            data: car
        });

    } catch (error) {

        console.error("Get car error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to get car",
            error: error.message
        });
    }
};


// ============================
// GET ALL CARS
// ============================

const getCars = async (req, res) => {
    try {

        const cars = await carModel.getAllCars();

        res.status(200).json({
            success: true,
            count: cars.length,
            data: cars
        });

    } catch (error) {

        console.error("Get cars error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to get cars",
            error: error.message
        });
    }
};


// ============================
// UPDATE CAR
// ============================

const updateCar = async (req, res) => {
    try {

        const { id } = req.params;

        const existingCar = await carModel.getCarById(id);

        if (!existingCar) {
            return res.status(404).json({
                success: false,
                message: "Car not found"
            });
        }

        const car = await carModel.updateCar(
            id,
            req.body
        );

        res.status(200).json({
            success: true,
            message: "Car updated successfully",
            data: car
        });

    } catch (error) {

        console.error("Update car error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update car",
            error: error.message
        });
    }
};


// ============================
// DELETE CAR
// ============================

const deleteCar = async (req, res) => {
    try {

        const { id } = req.params;

        const car = await carModel.deleteCar(id);

        if (!car) {
            return res.status(404).json({
                success: false,
                message: "Car not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Car deleted successfully",
            data: car
        });

    } catch (error) {

        console.error("Delete car error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete car",
            error: error.message
        });
    }
};


// ============================
// SEND CAR TO YANGO
// ============================

const syncCarToYango = async (req, res) => {
    try {

        const { id } = req.params;

        // 1. Get local car
        const car = await carModel.getCarById(id);

        if (!car) {
            return res.status(404).json({
                success: false,
                message: "Car not found"
            });
        }

        // 2. Check whether already synced
        if (car.yango_synced && car.yango_vehicle_id) {
            return res.status(400).json({
                success: false,
                message: "Car is already synced with Yango",
                yango_vehicle_id: car.yango_vehicle_id
            });
        }

        // 3. Send car to Yango
        const yangoResponse =
            await yangoService.createCarInYango(car);

        // 4. Yango returns vehicle_id
        const yangoVehicleId =
            yangoResponse.vehicle_id;

        if (!yangoVehicleId) {

            await carModel.updateYangoError(
                id,
                "Yango did not return vehicle_id"
            );

            return res.status(500).json({
                success: false,
                message: "Yango did not return vehicle_id"
            });
        }

        // 5. Save Yango ID locally
        const updatedCar =
            await carModel.updateYangoInfo(
                id,
                yangoVehicleId
            );

        // 6. Return result
        res.status(200).json({
            success: true,
            message: "Car successfully synchronized with Yango",
            data: updatedCar
        });

    } catch (error) {

        console.error(
            "Yango synchronization error:",
            error.response?.data || error.message
        );

        const { id } = req.params;

        try {

            await carModel.updateYangoError(
                id,
                error.response?.data?.message ||
                error.message
            );

        } catch (dbError) {

            console.error(
                "Failed to save Yango error:",
                dbError.message
            );
        }

        res.status(500).json({
            success: false,
            message: "Failed to synchronize car with Yango",
            error:
                error.response?.data ||
                error.message
        });
    }
};


module.exports = {
    createCar,
    getCar,
    getCars,
    updateCar,
    deleteCar,
    syncCarToYango
};