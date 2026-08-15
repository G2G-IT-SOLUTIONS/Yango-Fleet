const pool = require("../config/db");

// Create car
const createCar = async (car) => {
    const query = `
        INSERT INTO cars (
            brand,
            model,
            color,
            year,
            transmission,
            vin,
            body_number,
            mileage,
            license_plate_number,
            registration_certificate,
            taxi_license_number,
            callsign,
            status,
            fuel_type,
            ownership_type,
            is_park_property,
            comment
        )
        VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15,
            $16, $17
        )
        RETURNING *
    `;

    const values = [
        car.brand,
        car.model,
        car.color,
        car.year,
        'mechanical',
        '12345678909876543',
        '123456789',
        0,
        car.license_plate_number,
        car.registration_certificate,
        '12345678',
        'CS-55',
        'working',
        'petrol',
        'park',
        true,
        car.comment
    ];

    const result = await pool.query(query, values);

    return result.rows[0];
};


// Get one car
const getCarById = async (id) => {
    const query = `
        SELECT *
        FROM cars
        WHERE id = $1
    `;

    const result = await pool.query(query, [id]);

    return result.rows[0];
};


// Get all cars
const getAllCars = async () => {
    const query = `
        SELECT *
        FROM cars
        ORDER BY created_at DESC
    `;

    const result = await pool.query(query);

    return result.rows;
};


// Update car
const updateCar = async (id, car) => {
    const query = `
        UPDATE cars
        SET
            brand = $1,
            model = $2,
            color = $3,
            year = $4,
            transmission = $5,
            vin = $6,
            body_number = $7,
            mileage = $8,
            license_plate_number = $9,
            registration_certificate = $10,
            taxi_license_number = $11,
            callsign = $12,
            status = $13,
            fuel_type = $14,
            ownership_type = $15,
            is_park_property = $16,
            comment = $17,
            updated_at = NOW()
        WHERE id = $18
        RETURNING *
    `;

    const values = [
         car.brand,
        car.model,
        car.color,
        car.year,
        'mechanical',
        '12345678909876543',
        '123456789',
        0,
        car.license_plate_number,
        car.registration_certificate,
        '12345678',
        'CS-55',
        'working',
        'petrol',
        'park',
        true,
        car.comment,
        id
    ];

    const result = await pool.query(query, values);

    return result.rows[0];
};


// Delete car
const deleteCar = async (id) => {
    const query = `
        DELETE FROM cars
        WHERE id = $1
        RETURNING *
    `;

    const result = await pool.query(query, [id]);

    return result.rows[0];
};


// Update Yango information
const updateYangoInfo = async (id, yangoVehicleId) => {
    const query = `
        UPDATE cars
        SET
            yango_vehicle_id = $1,
            yango_synced = TRUE,
            yango_sync_error = NULL,
            yango_last_synced_at = NOW(),
            updated_at = NOW()
        WHERE id = $2
        RETURNING *
    `;

    const result = await pool.query(query, [
        yangoVehicleId,
        id
    ]);

    return result.rows[0];
};


// Save Yango error
const updateYangoError = async (id, errorMessage) => {
    const query = `
        UPDATE cars
        SET
            yango_synced = FALSE,
            yango_sync_error = $1,
            updated_at = NOW()
        WHERE id = $2
        RETURNING *
    `;

    const result = await pool.query(query, [
        errorMessage,
        id
    ]);

    return result.rows[0];
};


module.exports = {
    createCar,
    getCarById,
    getAllCars,
    updateCar,
    deleteCar,
    updateYangoInfo,
    updateYangoError
};