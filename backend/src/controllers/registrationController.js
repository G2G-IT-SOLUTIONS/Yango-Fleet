const registrationModel = require("../models/registrationModel");
const carModel = require("../models/carModel");
const driverModel = require("../models/driverModel");
const bindingModel = require("../models/carDriverBindingModel");
const yangoService = require("../services/yangoService");
const axios = require("axios");

// Helper function to make HTTP requests to our own API
const callInternalApi = async (method, url, data = null) => {
    const baseURL = `http://localhost:${process.env.PORT || 5000}`;
    try {
        const response = await axios({
            method,
            url: `${baseURL}${url}`,
            data,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// ==========================================
// CREATE FULL REGISTRATION (Orchestrator)
// ==========================================

const createFullRegistration = async (req, res) => {
    try {
        const { car, driver } = req.body;
        const sales_employee_id = req.employeeId;

        // Validate required fields
        if (!car || !driver) {
            return res.status(400).json({
                success: false,
                message: "car and driver data are required"
            });
        }

        if (!car.brand || !car.model || !car.license_plate_number) {
            return res.status(400).json({
                success: false,
                message: "car brand, model, and license_plate_number are required"
            });
        }

        if (!driver.first_name || !driver.last_name || !driver.license_number) {
            return res.status(400).json({
                success: false,
                message: "driver first_name, last_name, and license_number are required"
            });
        }

        console.log(`📝 Starting registration by employee: ${sales_employee_id}`);

        // ==========================================
        // STEP 1: Create Car
        // ==========================================
        console.log("🚗 Creating car...");
        let carData;
        try {
            const carResponse = await callInternalApi('POST', '/api/cars', car);
            if (!carResponse.success) {
                throw new Error(carResponse.message || 'Failed to create car');
            }
            carData = carResponse.data;
            console.log(`✅ Car created with ID: ${carData.id}`);
        } catch (error) {
            console.error("❌ Car creation failed:", error);
            return res.status(400).json({
                success: false,
                message: "Failed to create car",
                error: error.message,
                step: "car_creation"
            });
        }

        // ==========================================
        // STEP 2: Create Driver
        // ==========================================
      console.log("👤 Creating driver...");
let driverData;
try {
    // work_rule_id is already in driver object from req.body
    const driverPayload = {
        first_name: driver.first_name,
        middle_name: driver.middle_name,
        last_name: driver.last_name,
        phone: driver.phone,
        email: driver.email,
        address: driver.address,
        birth_date: driver.birth_date,
        license_country: driver.license_country,
        license_number: driver.license_number,
        license_issue_date: driver.license_issue_date,
        license_expiry_date: driver.license_expiry_date,
        driving_experience_since: driver.driving_experience_since,
        id_document_address: driver.id_document_address,
        tax_identification_number: driver.tax_identification_number,
        hire_date: driver.hire_date,
        comment: driver.comment,
        work_rule_id: driver.work_rule_id || null  // ← Pass to Yango (not stored locally)
    };
    
    const driverResponse = await callInternalApi('POST', '/api/drivers', driverPayload);
    if (!driverResponse.success) {
        throw new Error(driverResponse.message || 'Failed to create driver');
    }
    driverData = driverResponse.data;
    console.log(`✅ Driver created with ID: ${driverData.id}`);
} catch (error) {
    console.error("❌ Driver creation failed:", error);
    try {
        await callInternalApi('DELETE', `/api/cars/${carData.id}`);
        console.log(`🔄 Rolled back car: ${carData.id}`);
    } catch (rollbackError) {
        console.error("⚠️ Rollback failed:", rollbackError.message);
    }
    return res.status(400).json({
        success: false,
        message: "Failed to create driver",
        error: error.message,
        step: "driver_creation",
        car_created: carData
    });
}
        // ==========================================
        // STEP 3: Create Registration Record
        // ==========================================
        console.log("📋 Creating registration record...");
        let registration;
        try {
            registration = await registrationModel.createRegistration({
                car_id: carData.id,
                driver_id: driverData.id,
                sales_employee_id: sales_employee_id,
                status: 'pending'
            });
            console.log(`✅ Registration created with ID: ${registration.id}`);
        } catch (error) {
            console.error("❌ Registration creation failed:", error);
            try {
                await callInternalApi('DELETE', `/api/cars/${carData.id}`);
                await callInternalApi('DELETE', `/api/drivers/${driverData.id}`);
                console.log(`🔄 Rolled back car and driver`);
            } catch (rollbackError) {
                console.error("⚠️ Rollback failed:", rollbackError.message);
            }
            return res.status(500).json({
                success: false,
                message: "Failed to create registration record",
                error: error.message,
                step: "registration_creation",
                car_created: carData,
                driver_created: driverData
            });
        }

      // ==========================================
// STEP 4: Create Binding (Car + Driver)
// ==========================================
console.log("🔗 Creating car-driver binding...");
let binding;
try {
    const bindingResponse = await callInternalApi('POST', '/api/bindings', {
        car_id: carData.id,
        driver_id: driverData.id
    });
    if (!bindingResponse.success) {
        throw new Error(bindingResponse.message || 'Failed to create binding');
    }
    binding = bindingResponse.data;
    console.log(`✅ Binding created with ID: ${binding.id}`);
} catch (error) {
    console.error("❌ Binding creation failed:", error);
    
    // ROLLBACK: Delete car and driver if binding fails
    try {
        await callInternalApi('DELETE', `/api/cars/${carData.id}`);
        await callInternalApi('DELETE', `/api/drivers/${driverData.id}`);
        console.log(`🔄 Rolled back car: ${carData.id} and driver: ${driverData.id}`);
    } catch (rollbackError) {
        console.error("⚠️ Rollback failed:", rollbackError.message);
    }
    
    await registrationModel.updateRegistrationStatus(registration.id, 'failed');
    
    return res.status(400).json({
        success: false,
        message: "Failed to bind car and driver. Registration rolled back.",
        error: error.message,
        step: "binding_creation"
    });
}

        // ==========================================
        // STEP 5: Try to Sync Everything with Yango
        // ==========================================
        console.log("☁️ Syncing with Yango...");
        let yangoSuccess = false; // <-- FIXED: Define yangoSuccess here
        let yangoError = null;

        try {
            // Check if Yango credentials are configured
            if (process.env.YANGO_API_KEY && process.env.YANGO_CLIENT_ID && process.env.YANGO_PARK_ID) {
                
                // Sync car to Yango
                const carSyncResponse = await callInternalApi('POST', `/api/cars/${carData.id}/sync-yango`, {});
                if (carSyncResponse.success) {
                    console.log(`✅ Car synced with Yango: ${carSyncResponse.data?.yango_vehicle_id || 'unknown'}`);
                    
                    // Sync driver to Yango (with the car's Yango ID)
                    const updatedCar = await carModel.getCarById(carData.id);
                    if (updatedCar?.yango_vehicle_id) {
                        const driverSyncResponse = await callInternalApi('POST', `/api/drivers/${driverData.id}/sync-yango`, {
                            car_yango_id: updatedCar.yango_vehicle_id,
                             work_rule_id: driver.work_rule_id
                        });
                        
                        if (driverSyncResponse.success) {
                            console.log(`✅ Driver synced with Yango: ${driverSyncResponse.data?.yango_driver_id || 'unknown'}`);
                            
                            // Sync binding to Yango
                            const bindingSyncResponse = await callInternalApi('POST', `/api/bindings/${binding.id}/sync-yango`, {});
                            if (bindingSyncResponse.success) {
                                console.log(`✅ Binding synced with Yango`);
                                yangoSuccess = true;
                            } else {
                                yangoError = "Binding sync failed: " + (bindingSyncResponse.message || 'Unknown error');
                            }
                        } else {
                            yangoError = "Driver sync failed: " + (driverSyncResponse.message || 'Unknown error');
                        }
                    } else {
                        yangoError = "Car Yango ID not found after sync";
                    }
                } else {
                    yangoError = "Car sync failed: " + (carSyncResponse.message || 'Unknown error');
                }
            } else {
                yangoError = "Yango credentials not configured";
                console.log(`⚠️ ${yangoError}`);
            }
        } catch (error) {
            console.error("❌ Yango sync error:", error.message);
            yangoError = error.message;
        }

        // ==========================================
        // STEP 6: Update Registration Status
        // ==========================================
        const finalStatus = yangoSuccess ? 'completed' : 'failed';
        await registrationModel.updateRegistrationStatus(registration.id, finalStatus);
        await registrationModel.updateYangoSyncStatus(registration.id, yangoSuccess, yangoError);

        // Get the complete registration with all details
        const completeRegistration = await registrationModel.getRegistrationById(registration.id);

        // ==========================================
        // STEP 7: Return Response
        // ==========================================
        const responseMessage = yangoSuccess 
            ? "Registration completed successfully with Yango sync" 
            : "Registration created locally but Yango sync failed";

        console.log(`🎉 Registration complete: ${finalStatus.toUpperCase()}`);

        res.status(201).json({
            success: true,
            message: responseMessage,
            data: {
                registration: completeRegistration,
                car: carData,
                driver: driverData,
                binding: binding,
                yango_synced: yangoSuccess,
                yango_error: yangoError
            }
        });

    } catch (error) {
        console.error("❌ Registration error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to complete registration",
            error: error.message
        });
    }
};

// ==========================================
// GET ALL REGISTRATIONS
// ==========================================

const getRegistrations = async (req, res) => {
    try {
        const { status, employee_id, car_id, driver_id, yango_synced } = req.query;
        
        // If no employee_id provided, use the logged-in user's ID
        const employeeId = employee_id || req.employeeId;
        
        const registrations = await registrationModel.getAllRegistrations({
            status,
            employee_id: employeeId,
            car_id,
            driver_id,
            yango_synced
        });

        res.status(200).json({
            success: true,
            count: registrations.length,
            data: registrations
        });
    } catch (error) {
        console.error("Get registrations error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get registrations",
            error: error.message
        });
    }
};

// ==========================================
// GET REGISTRATION BY ID
// ==========================================

const getRegistration = async (req, res) => {
    try {
        const { id } = req.params;
        const registration = await registrationModel.getRegistrationById(id);

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: "Registration not found"
            });
        }

        res.status(200).json({
            success: true,
            data: registration
        });
    } catch (error) {
        console.error("Get registration error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get registration",
            error: error.message
        });
    }
};

// ==========================================
// UPDATE REGISTRATION STATUS
// ==========================================

const updateRegistrationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status || !['pending', 'completed', 'failed', 'cancelled'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Valid status is required: pending, completed, failed, or cancelled"
            });
        }

        const registration = await registrationModel.updateRegistrationStatus(id, status);

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: "Registration not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Registration status updated successfully",
            data: registration
        });
    } catch (error) {
        console.error("Update registration status error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update registration status",
            error: error.message
        });
    }
};

// ==========================================
// DELETE REGISTRATION
// ==========================================

const deleteRegistration = async (req, res) => {
    try {
        const { id } = req.params;
        const registration = await registrationModel.deleteRegistration(id);

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: "Registration not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Registration deleted successfully",
            data: registration
        });
    } catch (error) {
        console.error("Delete registration error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete registration",
            error: error.message
        });
    }
};

// ==========================================
// GET ALL REGISTRATIONS FOR ADMIN
// (No employee filtering - for admin dashboard)
// ==========================================

const getAllRegistrationsForAdmin = async (req, res) => {
    try {
        console.log('📊 GET /api/registrations/admin/all - Fetching all registrations for admin');
        
        // Get all registrations without any employee filter
        const registrations = await registrationModel.getAllRegistrations({
            // No employee_id filter
        });

        console.log('📊 Found registrations:', registrations.length);

        res.status(200).json({
            success: true,
            count: registrations.length,
            data: registrations
        });
    } catch (error) {
        console.error("❌ Get all registrations error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get registrations",
            error: error.message
        });
    }
};

module.exports = {
    createFullRegistration,
    getRegistrations,
    getRegistration,
    updateRegistrationStatus,
    deleteRegistration,getAllRegistrationsForAdmin
};