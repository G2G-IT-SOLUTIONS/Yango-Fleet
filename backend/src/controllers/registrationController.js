// const registrationModel = require("../models/registrationModel");
// const carModel = require("../models/carModel");
// const driverModel = require("../models/driverModel");
// const bindingModel = require("../models/carDriverBindingModel");
// const yangoService = require("../services/yangoService");
// const axios = require("axios");

// // Helper function to make HTTP requests to our own API
// const callInternalApi = async (method, url, data = null) => {
//     const baseURL = `http://localhost:${process.env.PORT || 5000}`;
//     try {
//         const response = await axios({
//             method,
//             url: `${baseURL}${url}`,
//             data,
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//              validateStatus: (status) => status < 500
//         });
//          // If response is 204 No Content or 404 Not Found
//         if (response.status === 204 || response.status === 404) {
//             return { success: false, data: null, status: response.status };
//         }
        
//         // If response is empty or null
//         if (!response.data) {
//             return { success: false, data: null, message: 'No data returned' };
//         }
        
//         return response.data;
//     } catch (error) {
//         if (error.response?.status === 404) {
//             return { success: false, data: null, message: 'Resource not found' };
//         }
//         throw error.response?.data || error.message;
//     }
// };

// // ==========================================
// // CREATE FULL REGISTRATION (Atomic)
// // ==========================================

// const createFullRegistration = async (req, res) => {
//     try {
//         const { car, driver } = req.body;
//         const sales_employee_id = req.employeeId;

//         // Validate required fields
//         if (!car || !driver) {
//             return res.status(400).json({
//                 success: false,
//                 message: "car and driver data are required"
//             });
//         }

//         if (!car.brand || !car.model || !car.license_plate_number) {
//             return res.status(400).json({
//                 success: false,
//                 message: "car brand, model, and license_plate_number are required"
//             });
//         }

//         if (!driver.first_name || !driver.last_name || !driver.license_number) {
//             return res.status(400).json({
//                 success: false,
//                 message: "driver first_name, last_name, and license_number are required"
//             });
//         }

//         console.log(`📝 Starting registration by employee: ${sales_employee_id}`);

//         // ==========================================
//         // STEP 1: Create Car Locally (Temporary)
//         // ==========================================
//         console.log("🚗 Creating car locally...");
//         let carData;
//         try {
//             const carResponse = await callInternalApi('POST', '/api/cars', car);
//             if (!carResponse.success) {
//                 throw new Error(carResponse.message || 'Failed to create car');
//             }
//             carData = carResponse.data;
//             console.log(`✅ Car created locally with ID: ${carData.id}`);
//         } catch (error) {
//             console.error("❌ Car creation failed:", error);
//             return res.status(400).json({
//                 success: false,
//                 message: "Failed to create car",
//                 error: error.message,
//                 step: "car_creation"
//             });
//         }

//         // ==========================================
//         // STEP 2: Create Driver Locally (Temporary)
//         // ==========================================
//         console.log("👤 Creating driver locally...");
//         let driverData;
//         try {
//             const driverPayload = {
//                 first_name: driver.first_name,
//                 middle_name: driver.middle_name,
//                 last_name: driver.last_name,
//                 phone: driver.phone,
//                 email: driver.email,
//                 address: driver.address,
//                 birth_date: driver.birth_date,
//                 license_country: driver.license_country,
//                 license_number: driver.license_number,
//                 license_issue_date: driver.license_issue_date,
//                 license_expiry_date: driver.license_expiry_date,
//                 driving_experience_since: driver.driving_experience_since,
//                 id_document_address: driver.id_document_address,
//                 tax_identification_number: driver.tax_identification_number,
//                 hire_date: driver.hire_date,
//                 comment: driver.comment,
//                 work_rule_id: driver.work_rule_id || null
//             };
            
//             const driverResponse = await callInternalApi('POST', '/api/drivers', driverPayload);
//             if (!driverResponse.success) {
//                 throw new Error(driverResponse.message || 'Failed to create driver');
//             }
//             driverData = driverResponse.data;
//             console.log(`✅ Driver created locally with ID: ${driverData.id}`);
//         } catch (error) {
//             console.error("❌ Driver creation failed:", error);
//             // Rollback: Delete the car we just created
//             try {
//                 await callInternalApi('DELETE', `/api/cars/${carData.id}`);
//                 console.log(`🔄 Rolled back car: ${carData.id}`);
//             } catch (rollbackError) {
//                 console.error("⚠️ Rollback failed:", rollbackError.message);
//             }
//             return res.status(400).json({
//                 success: false,
//                 message: "Failed to create driver",
//                 error: error.message,
//                 step: "driver_creation"
//             });
//         }

//         // ==========================================
//         // STEP 3: Create Binding Locally (Temporary)
//         // ==========================================
//         console.log("🔗 Creating car-driver binding locally...");
//         let binding;
//         try {
//             const bindingResponse = await callInternalApi('POST', '/api/bindings', {
//                 car_id: carData.id,
//                 driver_id: driverData.id
//             });
//             if (!bindingResponse.success) {
//                 throw new Error(bindingResponse.message || 'Failed to create binding');
//             }
//             binding = bindingResponse.data;
//             console.log(`✅ Binding created locally with ID: ${binding.id}`);
//         } catch (error) {
//             console.error("❌ Binding creation failed:", error);
//             // Rollback: Delete car and driver
//             try {
//                 await callInternalApi('DELETE', `/api/cars/${carData.id}`);
//                 await callInternalApi('DELETE', `/api/drivers/${driverData.id}`);
//                 console.log(`🔄 Rolled back car and driver`);
//             } catch (rollbackError) {
//                 console.error("⚠️ Rollback failed:", rollbackError.message);
//             }
//             return res.status(400).json({
//                 success: false,
//                 message: "Failed to bind car and driver",
//                 error: error.message,
//                 step: "binding_creation"
//             });
//         }

//         // ==========================================
//         // STEP 4: Try to Sync Everything with Yango
//         // ==========================================
//         console.log("☁️ Syncing with Yango...");
//         let yangoSuccess = false;
//         let yangoError = null;
//         let yangoCarId = null;
//         let yangoDriverId = null;

//         try {
//             // Check if Yango credentials are configured
//             if (process.env.YANGO_API_KEY && process.env.YANGO_CLIENT_ID && process.env.YANGO_PARK_ID) {
                
//                 // 4a. Sync car to Yango
//                 console.log("🚗 Syncing car to Yango...");
//                 const carSyncResponse = await callInternalApi('POST', `/api/cars/${carData.id}/sync-yango`, {});
//                 if (carSyncResponse.success) {
//                     yangoCarId = carSyncResponse.data?.yango_vehicle_id;
//                     console.log(`✅ Car synced with Yango: ${yangoCarId}`);
                    
//                     // 4b. Sync driver to Yango
//                     console.log("👤 Syncing driver to Yango...");
//                     const updatedCar = await carModel.getCarById(carData.id);
//                     if (updatedCar?.yango_vehicle_id) {
//                         const driverSyncResponse = await callInternalApi('POST', `/api/drivers/${driverData.id}/sync-yango`, {
//                             car_yango_id: updatedCar.yango_vehicle_id,
//                             work_rule_id: driver.work_rule_id
//                         });
                        
//                         if (driverSyncResponse.success) {
//                             yangoDriverId = driverSyncResponse.data?.yango_driver_id;
//                             console.log(`✅ Driver synced with Yango: ${yangoDriverId}`);
                            
//                             // 4c. Sync binding to Yango
//                             console.log("🔗 Syncing binding to Yango...");
//                             const bindingSyncResponse = await callInternalApi('POST', `/api/bindings/${binding.id}/sync-yango`, {});
//                             if (bindingSyncResponse.success) {
//                                 console.log(`✅ Binding synced with Yango`);
//                                 yangoSuccess = true;
//                             } else {
//                                 yangoError = "Binding sync failed: " + (bindingSyncResponse.message || 'Unknown error');
//                                 console.log(`❌ ${yangoError}`);
//                             }
//                         } else {
//                             yangoError = "Driver sync failed: " + (driverSyncResponse.message || 'Unknown error');
//                             console.log(`❌ ${yangoError}`);
//                         }
//                     } else {
//                         yangoError = "Car Yango ID not found after sync";
//                         console.log(`❌ ${yangoError}`);
//                     }
//                 } else {
//                     yangoError = "Car sync failed: " + (carSyncResponse.message || 'Unknown error');
//                     console.log(`❌ ${yangoError}`);
//                 }
//             } else {
//                 yangoError = "Yango credentials not configured";
//                 console.log(`⚠️ ${yangoError}`);
//             }
//         } catch (error) {
//             console.error("❌ Yango sync error:", error.message);
//             yangoError = error.message;
//         }

//       // ==========================================
//      // STEP 5: If Yango sync failed, ROLLBACK everything
//      // ==========================================
//          if (!yangoSuccess) {
//           console.log("❌ Yango sync failed. Rolling back local records...");
    
//             let rollbackErrors = [];
    
//      // Delete binding
//      try {
//         const result = await callInternalApi('DELETE', `/api/bindings/${binding.id}`);
//         if (result.success !== false) {
//             console.log(`🔄 Deleted binding: ${binding.id}`);
//         } else {
//             console.log(`⚠️ Binding may not exist: ${binding.id}`);
//         }
//     } catch (rollbackError) {
//         console.error("⚠️ Binding rollback failed:", rollbackError.message);
//         rollbackErrors.push({ entity: 'binding', error: rollbackError.message });
//     }
    
//     // Delete car
//     try {
//         const result = await callInternalApi('DELETE', `/api/cars/${carData.id}`);
//         if (result.success !== false) {
//             console.log(`🔄 Deleted car: ${carData.id}`);
//         } else {
//             console.log(`⚠️ Car may not exist: ${carData.id}`);
//         }
//     } catch (rollbackError) {
//         console.error("⚠️ Car rollback failed:", rollbackError.message);
//         rollbackErrors.push({ entity: 'car', error: rollbackError.message });
//     }
    
//     // Delete driver
//     try {
//         const result = await callInternalApi('DELETE', `/api/drivers/${driverData.id}`);
//         if (result.success !== false) {
//             console.log(`🔄 Deleted driver: ${driverData.id}`);
//         } else {
//             console.log(`⚠️ Driver may not exist: ${driverData.id}`);
//         }
//     } catch (rollbackError) {
//         console.error("⚠️ Driver rollback failed:", rollbackError.message);
//         rollbackErrors.push({ entity: 'driver', error: rollbackError.message });
//     }
    
//     // Return error with rollback status
//     return res.status(400).json({
//         success: false,
//         message: "Registration failed: Could not sync with Yango. Local records rolled back.",
//         error: yangoError,
//         yango_synced: false,
//         step: "yango_sync",
//         rollback_errors: rollbackErrors.length > 0 ? rollbackErrors : undefined
//     });
// }
//         // ==========================================
//         // STEP 6: Create Registration Record (ONLY IF YANGO SYNC SUCCEEDED)
//         // ==========================================
//         console.log("📋 Creating registration record...");
//         let registration;
//         try {
//             registration = await registrationModel.createRegistration({
//                 car_id: carData.id,
//                 driver_id: driverData.id,
//                 sales_employee_id: sales_employee_id,
//                 status: 'completed'
//             });
//             console.log(`✅ Registration created with ID: ${registration.id}`);
            
//             // Update Yango sync status for registration
//             await registrationModel.updateYangoSyncStatus(registration.id, true, null);
//         } catch (error) {
//             console.error("❌ Registration creation failed:", error);
//             // Even if registration creation fails, Yango already has the data
//             // But we should still rollback local records
//             try {
//                 await callInternalApi('DELETE', `/api/bindings/${binding.id}`);
//                 await callInternalApi('DELETE', `/api/cars/${carData.id}`);
//                 await callInternalApi('DELETE', `/api/drivers/${driverData.id}`);
//             } catch (rollbackError) {
//                 console.error("⚠️ Rollback failed:", rollbackError.message);
//             }
//             return res.status(500).json({
//                 success: false,
//                 message: "Failed to create registration record after Yango sync",
//                 error: error.message,
//                 step: "registration_creation"
//             });
//         }

//         // ==========================================
//         // STEP 7: Return Success Response
//         // ==========================================
//         const completeRegistration = await registrationModel.getRegistrationById(registration.id);

//         console.log(`🎉 Registration complete: COMPLETED (Yango synced successfully)`);

//         res.status(201).json({
//             success: true,
//             message: "Registration completed successfully with Yango sync",
//             data: {
//                 registration: completeRegistration,
//                 car: carData,
//                 driver: driverData,
//                 binding: binding,
//                 yango_synced: true,
//                 yango_car_id: yangoCarId,
//                 yango_driver_id: yangoDriverId
//             }
//         });

//     } catch (error) {
//         console.error("❌ Registration error:", error);
//         res.status(500).json({
//             success: false,
//             message: "Failed to complete registration",
//             error: error.message
//         });
//     }
// };
// // ==========================================
// // GET ALL REGISTRATIONS
// // ==========================================

// const getRegistrations = async (req, res) => {
//     try {
//         const { status, employee_id, car_id, driver_id, yango_synced } = req.query;
        
//         // If no employee_id provided, use the logged-in user's ID
//         const employeeId = employee_id || req.employeeId;
        
//         const registrations = await registrationModel.getAllRegistrations({
//             status,
//             employee_id: employeeId,
//             car_id,
//             driver_id,
//             yango_synced
//         });

//         res.status(200).json({
//             success: true,
//             count: registrations.length,
//             data: registrations
//         });
//     } catch (error) {
//         console.error("Get registrations error:", error);
//         res.status(500).json({
//             success: false,
//             message: "Failed to get registrations",
//             error: error.message
//         });
//     }
// };

// // ==========================================
// // GET REGISTRATION BY ID
// // ==========================================

// const getRegistration = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const registration = await registrationModel.getRegistrationById(id);

//         if (!registration) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Registration not found"
//             });
//         }

//         res.status(200).json({
//             success: true,
//             data: registration
//         });
//     } catch (error) {
//         console.error("Get registration error:", error);
//         res.status(500).json({
//             success: false,
//             message: "Failed to get registration",
//             error: error.message
//         });
//     }
// };

// // ==========================================
// // UPDATE REGISTRATION STATUS
// // ==========================================

// const updateRegistrationStatus = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const { status } = req.body;

//         if (!status || !['pending', 'completed', 'failed', 'cancelled'].includes(status)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Valid status is required: pending, completed, failed, or cancelled"
//             });
//         }

//         const registration = await registrationModel.updateRegistrationStatus(id, status);

//         if (!registration) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Registration not found"
//             });
//         }

//         res.status(200).json({
//             success: true,
//             message: "Registration status updated successfully",
//             data: registration
//         });
//     } catch (error) {
//         console.error("Update registration status error:", error);
//         res.status(500).json({
//             success: false,
//             message: "Failed to update registration status",
//             error: error.message
//         });
//     }
// };

// // ==========================================
// // DELETE REGISTRATION
// // ==========================================

// const deleteRegistration = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const registration = await registrationModel.deleteRegistration(id);

//         if (!registration) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Registration not found"
//             });
//         }

//         res.status(200).json({
//             success: true,
//             message: "Registration deleted successfully",
//             data: registration
//         });
//     } catch (error) {
//         console.error("Delete registration error:", error);
//         res.status(500).json({
//             success: false,
//             message: "Failed to delete registration",
//             error: error.message
//         });
//     }
// };

// // ==========================================
// // GET ALL REGISTRATIONS FOR ADMIN
// // (No employee filtering - for admin dashboard)
// // ==========================================

// const getAllRegistrationsForAdmin = async (req, res) => {
//     try {
//         console.log('📊 GET /api/registrations/admin/all - Fetching all registrations for admin');
        
//         // Get all registrations without any employee filter
//         const registrations = await registrationModel.getAllRegistrations({
//             // No employee_id filter
//         });

//         console.log('📊 Found registrations:', registrations.length);

//         res.status(200).json({
//             success: true,
//             count: registrations.length,
//             data: registrations
//         });
//     } catch (error) {
//         console.error("❌ Get all registrations error:", error);
//         res.status(500).json({
//             success: false,
//             message: "Failed to get registrations",
//             error: error.message
//         });
//     }
// };

// module.exports = {
//     createFullRegistration,
//     getRegistrations,
//     getRegistration,
//     updateRegistrationStatus,
//     deleteRegistration,getAllRegistrationsForAdmin
// };

// const registrationModel = require("../models/registrationModel");
// const carModel = require("../models/carModel");
// const driverModel = require("../models/driverModel");
// const bindingModel = require("../models/carDriverBindingModel");
// const yangoService = require("../services/yangoService");
// const pool = require("../config/db");  // ← IMPORTANT: Add this

// // ==========================================
// // CREATE FULL REGISTRATION (Atomic with Transaction)
// // ==========================================

// const createFullRegistration = async (req, res) => {
//     const client = await pool.connect();
    
//     try {
//         const { car, driver } = req.body;
//         const sales_employee_id = req.employeeId;

//         // Validate required fields
//         if (!car || !driver) {
//             return res.status(400).json({
//                 success: false,
//                 message: "car and driver data are required"
//             });
//         }

//         if (!car.brand || !car.model || !car.license_plate_number) {
//             return res.status(400).json({
//                 success: false,
//                 message: "car brand, model, and license_plate_number are required"
//             });
//         }

//         if (!driver.first_name || !driver.last_name || !driver.license_number) {
//             return res.status(400).json({
//                 success: false,
//                 message: "driver first_name, last_name, and license_number are required"
//             });
//         }

//         console.log(`📝 Starting registration by employee: ${sales_employee_id}`);

//         // ==========================================
//         // START TRANSACTION
//         // ==========================================
//         await client.query('BEGIN');

//         // ==========================================
//         // STEP 1: Create Car (within transaction)
//         // ==========================================
//         console.log("🚗 Creating car locally...");
//         const carResult = await client.query(
//             `INSERT INTO cars (
//                 brand, model, color, year, transmission,
//                 vin, body_number, mileage, license_plate_number,
//                 registration_certificate, taxi_license_number, callsign,
//                 status, fuel_type, ownership_type, is_park_property,
//                 category, "comment"
//             )
//             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
//             RETURNING *`,
//             [
//                 car.brand,
//                 car.model,
//                 car.color || 'Белый',
//                 car.year || 2023,
//                 car.transmission || 'mechanical',
//                 car.vin || 'W1KZF8EB5PA123456',
//                 '100000',//body number
//                 car.mileage ?? 0,
//                 car.license_plate_number,
//                 car.registration_certificate || null,
//                 car.taxi_license_number || null,
//                 'No Call Sign',
//                 car.status || 'working',
//                 car.fuel_type || 'petrol',
//                 car.ownership_type || 'park',
//                 car.is_park_property ?? true,
//                 car.category || null,
//                 car.comment || null
//             ]
//         );
//         const carData = carResult.rows[0];
//         console.log(`✅ Car created locally with ID: ${carData.id}`);

//         // ==========================================
//         // STEP 2: Create Driver (within transaction)
//         // ==========================================
//         console.log("👤 Creating driver locally...");
        
//         // Clean license number
//         let licenseNumber = driver.license_number || '';
//         licenseNumber = licenseNumber.replace(/[^a-zA-Z0-9]/g, '').trim();
//         if (!licenseNumber || licenseNumber.length < 4) {
//             licenseNumber = `DL${Date.now().toString().slice(-8)}`;
//         }

//         const driverResult = await client.query(
//             `INSERT INTO drivers (
//                 first_name, middle_name, last_name,
//                 phone, email, address,
//                 birth_date, license_country, license_number,
//                 license_issue_date, license_expiry_date,
//                 driving_experience_since, id_document_address,
//                 tax_identification_number, hire_date,
//                 "comment", work_rule_id
//             )
//             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
//             RETURNING *`,
//             [
//                 driver.first_name || 'Unknown',
//                 driver.middle_name || '',
//                 driver.last_name || 'Unknown',
//                 driver.phone || '+251900000000',
//                 driver.email || 'unknown@example.com',
//                 driver.address || 'No address provided',
//                 driver.birth_date || new Date(Date.now() - 25 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
//                 driver.license_country || 'eth',
//                 driver.license_number,
//                 driver.license_issue_date || new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
//                 driver.license_expiry_date || new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
//                 driver.driving_experience_since || new Date(Date.now() - 8 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
//                 'Ethiopia',
//                 '0000000000',
//                  new Date().toISOString().split('T')[0],
//                 driver.comment || '',
//                 driver.work_rule_id || null
//             ]
//         );
//         const driverData = driverResult.rows[0];
//         console.log(`✅ Driver created locally with ID: ${driverData.id}`);

//         // ==========================================
//         // STEP 3: Create Binding (within transaction)
//         // ==========================================
//         console.log("🔗 Creating car-driver binding locally...");
//         const bindingResult = await client.query(
//             `INSERT INTO car_driver_bindings (car_id, driver_id, is_active)
//              VALUES ($1, $2, $3)
//              RETURNING *`,
//             [carData.id, driverData.id, true]
//         );
//         const binding = bindingResult.rows[0];
//         console.log(`✅ Binding created locally with ID: ${binding.id}`);

//         // ==========================================
//         // STEP 4: Try to Sync Everything with Yango
//         // ==========================================
//         console.log("☁️ Syncing with Yango...");
//         let yangoSuccess = false;
//         let yangoError = null;
//         let yangoCarId = null;
//         let yangoDriverId = null;

//         try {
//             // Check if Yango credentials are configured
//             if (process.env.YANGO_API_KEY && process.env.YANGO_CLIENT_ID && process.env.YANGO_PARK_ID) {
                
//                 // 4a. Sync car to Yango - DIRECT CALL (not via API)
//                 console.log("🚗 Syncing car to Yango...");
//                 const carSyncResult = await yangoService.createCarInYango(carData);
//                 if (carSyncResult && carSyncResult.vehicle_id) {
//                     yangoCarId = carSyncResult.vehicle_id;
//                     console.log(`✅ Car synced with Yango: ${yangoCarId}`);
                    
//                     // Update car with Yango ID (within transaction)
//                     await client.query(
//                         `UPDATE cars 
//                          SET yango_vehicle_id = $1, yango_synced = TRUE, yango_last_synced_at = NOW()
//                          WHERE id = $2`,
//                         [yangoCarId, carData.id]
//                     );
                    
//                     // 4b. Sync driver to Yango
//                     console.log("👤 Syncing driver to Yango...");
//                     const driverSyncResult = await yangoService.createDriverInYango(driverData, yangoCarId);
//                     if (driverSyncResult && driverSyncResult.contractor_profile_id) {
//                        yangoDriverId = driverSyncResult.contractor_profile_id;
//                        console.log(`✅ Driver synced with Yango: ${yangoDriverId}`);
    
//                         // Update driver with Yango ID (within transaction)
//                        await client.query(
//                           `UPDATE drivers 
//                           SET yango_driver_id = $1, yango_synced = TRUE, yango_last_synced_at = NOW()
//                       WHERE id = $2`,
//                       [yangoDriverId, driverData.id]
//                           );
//      // 4c. Sync binding to Yango
//     console.log("🔗 Syncing binding to Yango...");
//     await yangoService.bindCarToDriverInYango(yangoCarId, yangoDriverId);
    
//     // Update binding with Yango sync status (within transaction)
//     await client.query(
//         `UPDATE car_driver_bindings 
//          SET yango_synced = TRUE, yango_sync_error = NULL, yango_last_synced_at = NOW()
//          WHERE id = $1`,
//         [binding.id]
//     );
    
//     console.log(`✅ Binding synced with Yango`);
//     yangoSuccess = true;
// } else {
//     yangoError = "Driver sync failed - no contractor_profile_id returned";
//     console.log(`❌ ${yangoError}`);
//     console.log(`⚠️ Yango response:`, JSON.stringify(driverSyncResult, null, 2));
// }
//                 } else {
//                     yangoError = "Car sync failed: " + (carSyncResult?.message || 'Unknown error');
//                     console.log(`❌ ${yangoError}`);
//                 }
//             } else {
//                 yangoError = "Yango credentials not configured";
//                 console.log(`⚠️ ${yangoError}`);
//             }
//         } catch (error) {
//             console.error("❌ Yango sync error:", error.message);
//             yangoError = error.message;
//         }

//         // ==========================================
//         // STEP 5: If Yango sync failed, ROLLBACK transaction
//         // ==========================================
//         if (!yangoSuccess) {
//             console.log("❌ Yango sync failed. Rolling back transaction...");
            
//             // ← THIS IS THE KEY: Rollback the entire transaction
//             await client.query('ROLLBACK');
            
//             console.log(`🔄 Transaction rolled back. NO records saved to database.`);
            
//             return res.status(400).json({
//                 success: false,
//                 message: "Registration failed: Could not sync with Yango. All records rolled back.",
//                 error: yangoError,
//                 yango_synced: false,
//                 step: "yango_sync"
//             });
//         }

//         // ==========================================
//         // STEP 6: Create Registration (ONLY IF YANGO SYNC SUCCEEDED)
//         // ==========================================
//         console.log("📋 Creating registration record...");
//         const registrationResult = await client.query(
//             `INSERT INTO registrations (
//                 car_id, driver_id, sales_employee_id, status, yango_synced
//             )
//             VALUES ($1, $2, $3, $4, $5)
//             RETURNING *`,
//             [carData.id, driverData.id, sales_employee_id, 'completed', true]
//         );
//         const registration = registrationResult.rows[0];
//         console.log(`✅ Registration created with ID: ${registration.id}`);

//         // ==========================================
//         // STEP 7: COMMIT the transaction
//         // ==========================================
//         await client.query('COMMIT');
//         console.log(`🎉 Registration complete: COMPLETED (Yango synced successfully)`);

//         res.status(201).json({
//             success: true,
//             message: "Registration completed successfully with Yango sync",
//             data: {
//                 registration,
//                 car: carData,
//                 driver: driverData,
//                 binding: binding,
//                 yango_synced: true,
//                 yango_car_id: yangoCarId,
//                 yango_driver_id: yangoDriverId
//             }
//         });

//     } catch (error) {
//         // On any error, rollback the transaction
//         await client.query('ROLLBACK');
//         console.error("❌ Registration error:", error);
//         res.status(500).json({
//             success: false,
//             message: "Failed to complete registration",
//             error: error.message
//         });
//     } finally {
//         client.release();
//     }
// };

// // ==========================================
// // GET ALL REGISTRATIONS
// // ==========================================

// const getRegistrations = async (req, res) => {
//     try {
//         const { status, employee_id, car_id, driver_id, yango_synced } = req.query;
        
//         // If no employee_id provided, use the logged-in user's ID
//         const employeeId = employee_id || req.employeeId;
        
//         const registrations = await registrationModel.getAllRegistrations({
//             status,
//             employee_id: employeeId,
//             car_id,
//             driver_id,
//             yango_synced
//         });

//         res.status(200).json({
//             success: true,
//             count: registrations.length,
//             data: registrations
//         });
//     } catch (error) {
//         console.error("Get registrations error:", error);
//         res.status(500).json({
//             success: false,
//             message: "Failed to get registrations",
//             error: error.message
//         });
//     }
// };

// // ==========================================
// // GET REGISTRATION BY ID
// // ==========================================

// const getRegistration = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const registration = await registrationModel.getRegistrationById(id);

//         if (!registration) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Registration not found"
//             });
//         }

//         res.status(200).json({
//             success: true,
//             data: registration
//         });
//     } catch (error) {
//         console.error("Get registration error:", error);
//         res.status(500).json({
//             success: false,
//             message: "Failed to get registration",
//             error: error.message
//         });
//     }
// };

// // ==========================================
// // UPDATE REGISTRATION STATUS
// // ==========================================

// const updateRegistrationStatus = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const { status } = req.body;

//         if (!status || !['pending', 'completed', 'failed', 'cancelled'].includes(status)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Valid status is required: pending, completed, failed, or cancelled"
//             });
//         }

//         const registration = await registrationModel.updateRegistrationStatus(id, status);

//         if (!registration) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Registration not found"
//             });
//         }

//         res.status(200).json({
//             success: true,
//             message: "Registration status updated successfully",
//             data: registration
//         });
//     } catch (error) {
//         console.error("Update registration status error:", error);
//         res.status(500).json({
//             success: false,
//             message: "Failed to update registration status",
//             error: error.message
//         });
//     }
// };

// // ==========================================
// // DELETE REGISTRATION
// // ==========================================

// const deleteRegistration = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const registration = await registrationModel.deleteRegistration(id);

//         if (!registration) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Registration not found"
//             });
//         }

//         res.status(200).json({
//             success: true,
//             message: "Registration deleted successfully",
//             data: registration
//         });
//     } catch (error) {
//         console.error("Delete registration error:", error);
//         res.status(500).json({
//             success: false,
//             message: "Failed to delete registration",
//             error: error.message
//         });
//     }
// };

// // ==========================================
// // GET ALL REGISTRATIONS FOR ADMIN
// // (No employee filtering - for admin dashboard)
// // ==========================================

// const getAllRegistrationsForAdmin = async (req, res) => {
//     try {
//         console.log('📊 GET /api/registrations/admin/all - Fetching all registrations for admin');
        
//         // Get all registrations without any employee filter
//         const registrations = await registrationModel.getAllRegistrations({
//             // No employee_id filter
//         });

//         console.log('📊 Found registrations:', registrations.length);

//         res.status(200).json({
//             success: true,
//             count: registrations.length,
//             data: registrations
//         });
//     } catch (error) {
//         console.error("❌ Get all registrations error:", error);
//         res.status(500).json({
//             success: false,
//             message: "Failed to get registrations",
//             error: error.message
//         });
//     }
// };

// module.exports = {
//     createFullRegistration,
//     getRegistrations,
//     getRegistration,
//     updateRegistrationStatus,
//     deleteRegistration,getAllRegistrationsForAdmin
// };

// module.exports = {
//     createFullRegistration,
//     getRegistrations,
//     getRegistration,
//     updateRegistrationStatus,
//     deleteRegistration,
//     getAllRegistrationsForAdmin
// };

// const registrationModel = require("../models/registrationModel");
// const carModel = require("../models/carModel");
// const driverModel = require("../models/driverModel");
// const bindingModel = require("../models/carDriverBindingModel");
// const yangoService = require("../services/yangoService");
// const pool = require("../config/db");

// // ==========================================
// // CREATE FULL REGISTRATION (Atomic with Transaction)
// // ==========================================

// const createFullRegistration = async (req, res) => {
//     const client = await pool.connect();
    
//     try {
//         const { car, driver } = req.body;
//         const sales_employee_id = req.employeeId;

//         // Validate required fields
//         if (!car || !driver) {
//             return res.status(400).json({
//                 success: false,
//                 message: "car and driver data are required"
//             });
//         }

//         if (!car.brand || !car.model || !car.license_plate_number) {
//             return res.status(400).json({
//                 success: false,
//                 message: "car brand, model, and license_plate_number are required"
//             });
//         }

//         if (!driver.first_name || !driver.last_name || !driver.license_number) {
//             return res.status(400).json({
//                 success: false,
//                 message: "driver first_name, last_name, and license_number are required"
//             });
//         }

//         console.log(`📝 Starting registration by employee: ${sales_employee_id}`);

//         // ==========================================
//         // START TRANSACTION
//         // ==========================================
//         await client.query('BEGIN');

//         // ==========================================
//         // STEP 1: Create Car (within transaction)
//         // ==========================================
//         console.log("🚗 Creating car locally...");
//         const carResult = await client.query(
//             `INSERT INTO cars (
//                 brand, model, color, year, transmission,
//                 vin, body_number, mileage, license_plate_number,
//                 registration_certificate, taxi_license_number, callsign,
//                 status, fuel_type, ownership_type, is_park_property,
//                 category, "comment"
//             )
//             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
//             RETURNING *`,
//             [
//                 car.brand,
//                 car.model,
//                 car.color || 'Белый',
//                 car.year || 2023,
//                 car.transmission || 'mechanical',
//                 car.vin || 'W1KZF8EB5PA123456',
//                 car.body_number || '100000',
//                 car.mileage ?? 0,
//                 car.license_plate_number,
//                 car.registration_certificate || null,
//                 car.taxi_license_number || null,
//                 car.callsign || 'No Call Sign',
//                 car.status || 'working',
//                 car.fuel_type || 'petrol',
//                 car.ownership_type || 'park',
//                 car.is_park_property ?? true,
//                 car.category || null,
//                 car.comment || null
//             ]
//         );
//         const carData = carResult.rows[0];
//         console.log(`✅ Car created locally with ID: ${carData.id}`);

//         // ==========================================
//         // STEP 2: Create Driver (within transaction)
//         // ==========================================
//         console.log("👤 Creating driver locally...");
        
//         // Generate license number if empty or invalid
//         let licenseNumber = driver.license_number || '';
//         licenseNumber = licenseNumber.replace(/[^a-zA-Z0-9]/g, '').trim();
//         if (!licenseNumber || licenseNumber.length < 4) {
//             const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
//             licenseNumber = `DL${random}`;
//             console.log(`⚠️ License number not provided, using generated: ${licenseNumber}`);
//         }
//         console.log(`📝 Using license number: ${licenseNumber}`);

//         // Generate TIN if empty or invalid
//         let tin = driver.tax_identification_number || '';
//         tin = tin.replace(/[^a-zA-Z0-9]/g, '').trim();
//         if (!tin || tin.length === 0 || tin === '0000000000') {
//             tin = `TIN${Date.now().toString().slice(-6)}`;
//             console.log(`⚠️ TIN not provided, using generated: ${tin}`);
//         }

//         const driverResult = await client.query(
//             `INSERT INTO drivers (
//                 first_name, middle_name, last_name,
//                 phone, email, address,
//                 birth_date, license_country, license_number,
//                 license_issue_date, license_expiry_date,
//                 driving_experience_since, id_document_address,
//                 tax_identification_number, hire_date,
//                 "comment", work_rule_id
//             )
//             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
//             RETURNING *`,
//             [
//                 driver.first_name || 'Unknown',
//                 driver.middle_name || '',
//                 driver.last_name || 'Unknown',
//                 driver.phone || '+251900000000',
//                 driver.email || 'unknown@example.com',
//                 driver.address || 'No address provided',
//                 driver.birth_date || new Date(Date.now() - 25 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
//                 driver.license_country || 'eth',
//                 licenseNumber,  // ✅ Use the variable, not driver.license_number
//                 driver.license_issue_date || new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
//                 driver.license_expiry_date || new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
//                 driver.driving_experience_since || new Date(Date.now() - 8 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
//                 driver.id_document_address || 'Ethiopia',
//                 tin,  // ✅ Use generated TIN
//                 driver.hire_date || new Date().toISOString().split('T')[0],
//                 driver.comment || '',
//                 driver.work_rule_id || null
//             ]
//         );
//         const driverData = driverResult.rows[0];
//         console.log(`✅ Driver created locally with ID: ${driverData.id} with license: ${licenseNumber}`);

//         // ==========================================
//         // STEP 3: Create Binding (within transaction)
//         // ==========================================
//         console.log("🔗 Creating car-driver binding locally...");
//         const bindingResult = await client.query(
//             `INSERT INTO car_driver_bindings (car_id, driver_id, is_active)
//              VALUES ($1, $2, $3)
//              RETURNING *`,
//             [carData.id, driverData.id, true]
//         );
//         const binding = bindingResult.rows[0];
//         console.log(`✅ Binding created locally with ID: ${binding.id}`);

//         // ==========================================
//         // STEP 4: Try to Sync Everything with Yango
//         // ==========================================
//         console.log("☁️ Syncing with Yango...");
//         let yangoSuccess = false;
//         let yangoError = null;
//         let yangoCarId = null;
//         let yangoDriverId = null;

//         try {
//             if (process.env.YANGO_API_KEY && process.env.YANGO_CLIENT_ID && process.env.YANGO_PARK_ID) {
                
//                 // 4a. Sync car to Yango
//                 console.log("🚗 Syncing car to Yango...");
//                 const carSyncResult = await yangoService.createCarInYango(carData);
//                 if (carSyncResult && carSyncResult.vehicle_id) {
//                     yangoCarId = carSyncResult.vehicle_id;
//                     console.log(`✅ Car synced with Yango: ${yangoCarId}`);
                    
//                     // Update car with Yango ID
//                     await client.query(
//                         `UPDATE cars 
//                          SET yango_vehicle_id = $1, yango_synced = TRUE, yango_last_synced_at = NOW()
//                          WHERE id = $2`,
//                         [yangoCarId, carData.id]
//                     );
                    
//                     // 4b. Sync driver to Yango (use the generated license number and TIN)
//                     console.log("👤 Syncing driver to Yango...");
//                     const driverForYango = {
//                         ...driverData,
//                         license_number: licenseNumber,
//                         tax_identification_number: tin
//                     };
//                     const driverSyncResult = await yangoService.createDriverInYango(driverForYango, yangoCarId);
                    
//                     if (driverSyncResult && driverSyncResult.contractor_profile_id) {
//                         yangoDriverId = driverSyncResult.contractor_profile_id;
//                         console.log(`✅ Driver synced with Yango: ${yangoDriverId}`);
                        
//                         // Update driver with Yango ID
//                         await client.query(
//                             `UPDATE drivers 
//                              SET yango_driver_id = $1, yango_synced = TRUE, yango_last_synced_at = NOW()
//                              WHERE id = $2`,
//                             [yangoDriverId, driverData.id]
//                         );
                        
//                         // 4c. Sync binding to Yango
//                         console.log("🔗 Syncing binding to Yango...");
//                         await yangoService.bindCarToDriverInYango(yangoCarId, yangoDriverId);
                        
//                         await client.query(
//                             `UPDATE car_driver_bindings 
//                              SET yango_synced = TRUE, yango_sync_error = NULL, yango_last_synced_at = NOW()
//                              WHERE id = $1`,
//                             [binding.id]
//                         );
                        
//                         console.log(`✅ Binding synced with Yango`);
//                         yangoSuccess = true;
//                     } else {
//                         yangoError = "Driver sync failed - no contractor_profile_id returned";
//                         console.log(`❌ ${yangoError}`);
//                         console.log(`⚠️ Yango response:`, JSON.stringify(driverSyncResult, null, 2));
//                     }
//                 } else {
//                     yangoError = "Car sync failed: " + (carSyncResult?.message || 'Unknown error');
//                     console.log(`❌ ${yangoError}`);
//                 }
//             } else {
//                 yangoError = "Yango credentials not configured";
//                 console.log(`⚠️ ${yangoError}`);
//             }
//         } catch (error) {
//             console.error("❌ Yango sync error:", error.message);
//             yangoError = error.message;
//         }

//         // ==========================================
//         // STEP 5: If Yango sync failed, ROLLBACK transaction
//         // ==========================================
//         if (!yangoSuccess) {
//             console.log("❌ Yango sync failed. Rolling back transaction...");
//             await client.query('ROLLBACK');
//             console.log(`🔄 Transaction rolled back. NO records saved to database.`);
            
//             return res.status(400).json({
//                 success: false,
//                 message: "Registration failed: Could not sync with Yango. All records rolled back.",
//                 error: yangoError,
//                 yango_synced: false,
//                 step: "yango_sync"
//             });
//         }

//         // ==========================================
//         // STEP 6: Create Registration (ONLY IF YANGO SYNC SUCCEEDED)
//         // ==========================================
//         console.log("📋 Creating registration record...");
//         const registrationResult = await client.query(
//             `INSERT INTO registrations (
//                 car_id, driver_id, sales_employee_id, status, yango_synced
//             )
//             VALUES ($1, $2, $3, $4, $5)
//             RETURNING *`,
//             [carData.id, driverData.id, sales_employee_id, 'completed', true]
//         );
//         const registration = registrationResult.rows[0];
//         console.log(`✅ Registration created with ID: ${registration.id}`);

//         // ==========================================
//         // STEP 7: COMMIT the transaction
//         // ==========================================
//         await client.query('COMMIT');
//         console.log(`🎉 Registration complete: COMPLETED (Yango synced successfully)`);

//         res.status(201).json({
//             success: true,
//             message: "Registration completed successfully with Yango sync",
//             data: {
//                 registration,
//                 car: carData,
//                 driver: driverData,
//                 binding: binding,
//                 yango_synced: true,
//                 yango_car_id: yangoCarId,
//                 yango_driver_id: yangoDriverId
//             }
//         });

//     } catch (error) {
//         await client.query('ROLLBACK');
//         console.error("❌ Registration error:", error);
//         res.status(500).json({
//             success: false,
//             message: "Failed to complete registration",
//             error: error.message
//         });
//     } finally {
//         client.release();
//     }
// };

// // ==========================================
// // GET ALL REGISTRATIONS
// // ==========================================

// const getRegistrations = async (req, res) => {
//     try {
//         const { status, employee_id, car_id, driver_id, yango_synced } = req.query;
//         const employeeId = employee_id || req.employeeId;
        
//         const registrations = await registrationModel.getAllRegistrations({
//             status,
//             employee_id: employeeId,
//             car_id,
//             driver_id,
//             yango_synced
//         });

//         res.status(200).json({
//             success: true,
//             count: registrations.length,
//             data: registrations
//         });
//     } catch (error) {
//         console.error("Get registrations error:", error);
//         res.status(500).json({
//             success: false,
//             message: "Failed to get registrations",
//             error: error.message
//         });
//     }
// };

// // ==========================================
// // GET REGISTRATION BY ID
// // ==========================================

// const getRegistration = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const registration = await registrationModel.getRegistrationById(id);

//         if (!registration) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Registration not found"
//             });
//         }

//         res.status(200).json({
//             success: true,
//             data: registration
//         });
//     } catch (error) {
//         console.error("Get registration error:", error);
//         res.status(500).json({
//             success: false,
//             message: "Failed to get registration",
//             error: error.message
//         });
//     }
// };

// // ==========================================
// // UPDATE REGISTRATION STATUS
// // ==========================================

// const updateRegistrationStatus = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const { status } = req.body;

//         if (!status || !['pending', 'completed', 'failed', 'cancelled'].includes(status)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Valid status is required: pending, completed, failed, or cancelled"
//             });
//         }

//         const registration = await registrationModel.updateRegistrationStatus(id, status);

//         if (!registration) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Registration not found"
//             });
//         }

//         res.status(200).json({
//             success: true,
//             message: "Registration status updated successfully",
//             data: registration
//         });
//     } catch (error) {
//         console.error("Update registration status error:", error);
//         res.status(500).json({
//             success: false,
//             message: "Failed to update registration status",
//             error: error.message
//         });
//     }
// };

// // ==========================================
// // DELETE REGISTRATION
// // ==========================================

// const deleteRegistration = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const registration = await registrationModel.deleteRegistration(id);

//         if (!registration) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Registration not found"
//             });
//         }

//         res.status(200).json({
//             success: true,
//             message: "Registration deleted successfully",
//             data: registration
//         });
//     } catch (error) {
//         console.error("Delete registration error:", error);
//         res.status(500).json({
//             success: false,
//             message: "Failed to delete registration",
//             error: error.message
//         });
//     }
// };

// // ==========================================
// // GET ALL REGISTRATIONS FOR ADMIN
// // ==========================================

// const getAllRegistrationsForAdmin = async (req, res) => {
//     try {
//         console.log('📊 GET /api/registrations/admin/all - Fetching all registrations for admin');
        
//         const registrations = await registrationModel.getAllRegistrations({});

//         console.log('📊 Found registrations:', registrations.length);

//         res.status(200).json({
//             success: true,
//             count: registrations.length,
//             data: registrations
//         });
//     } catch (error) {
//         console.error("❌ Get all registrations error:", error);
//         res.status(500).json({
//             success: false,
//             message: "Failed to get registrations",
//             error: error.message
//         });
//     }
// };

// module.exports = {
//     createFullRegistration,
//     getRegistrations,
//     getRegistration,
//     updateRegistrationStatus,
//     deleteRegistration,
//     getAllRegistrationsForAdmin
// };

const registrationModel = require("../models/registrationModel");
const carModel = require("../models/carModel");
const driverModel = require("../models/driverModel");
const bindingModel = require("../models/carDriverBindingModel");
const yangoService = require("../services/yangoService");
const pool = require("../config/db");

// ==========================================
// CREATE FULL REGISTRATION (Two-Phase Commit)
// ==========================================

// const createFullRegistration = async (req, res) => {
//     const client = await pool.connect();
    
//     try {
//         const { car, driver } = req.body;
//         const sales_employee_id = req.employeeId;

//         // Validate required fields
//         if (!car || !driver) {
//             return res.status(400).json({
//                 success: false,
//                 message: "car and driver data are required"
//             });
//         }

//         if (!car.brand || !car.model || !car.license_plate_number) {
//             return res.status(400).json({
//                 success: false,
//                 message: "car brand, model, and license_plate_number are required"
//             });
//         }

//         // ✅ STRICT VALIDATION: License number is REQUIRED, no generation
//         if (!driver.first_name || !driver.last_name) {
//             return res.status(400).json({
//                 success: false,
//                 message: "driver first_name and last_name are required"
//             });
//         }

//         // ✅ License number must be provided and valid
//         if (!driver.license_number || driver.license_number.trim().length < 4) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Valid license_number is required (minimum 4 characters)"
//             });
//         }

//         // ✅ REQUIRED: license_issue_date must be provided
//         if (!driver.license_issue_date) {
//             return res.status(400).json({
//                 success: false,
//                 message: "driver license_issue_date is required"
//             });
//         }

//         // ✅ REQUIRED: birth_date must be provided
//         if (!driver.birth_date) {
//             return res.status(400).json({
//                 success: false,
//                 message: "driver birth_date is required"
//             });
//         }

//         console.log(`📝 Starting registration by employee: ${sales_employee_id}`);

//         // ==========================================
//         // STEP 1: Calculate Derived Fields
//         // ==========================================
//         const calculateExpiryDate = (issueDate) => {
//             if (!issueDate) return null;
//             const d = new Date(issueDate);
//             d.setFullYear(d.getFullYear() + 2);
//             return d.toISOString().split('T')[0];
//         };

//         const today = new Date().toISOString().split('T')[0];

//         // Prepare driver data for Yango
//         const driverForYango = {
//             ...driver,
//             license_expiry_date: driver.license_expiry_date || calculateExpiryDate(driver.license_issue_date),
//             hire_date: driver.hire_date || today,
//             driving_experience_since: driver.driving_experience_since || driver.license_issue_date
//         };

//         const carForYango = { ...car };

//         // ==========================================
//         // STEP 2: CHECK IF DRIVER EXISTS IN YANGO
//         // ==========================================
//         let existingYangoDriver = null;
//         let existingYangoDriverId = null;
        
//         if (driver.phone) {
//             console.log(`🔍 Checking if driver ${driver.phone} exists in Yango...`);
//             try {
//                 const driverResult = await yangoService.searchDriverByPhone(driver.phone);
                
//                 if (driverResult?.exists) {
//                     existingYangoDriver = driverResult;
//                     existingYangoDriverId = driverResult.id;
//                     console.log(`📱 Driver exists in Yango with ID: ${existingYangoDriverId}, status: ${driverResult.work_status}`);
                    
//                     // If driver is working, block registration
//                     if (driverResult.work_status === "working") {
//                         return res.status(409).json({
//                             success: false,
//                             message: "Driver is already active in Yango. Cannot register.",
//                             conflict_type: "active_driver",
//                             driver_id: driverResult.id,
//                             work_status: driverResult.work_status
//                         });
//                     }
//                 }
//             } catch (searchError) {
//                 console.error('❌ Error checking driver existence:', searchError.message);
//                 // Continue with creation if search fails
//             }
//         }

//         // ==========================================
//         // STEP 3: Try Yango Sync
//         // ==========================================
//         console.log("☁️ Attempting Yango sync...");
//         let yangoCarId = null;
//         let yangoDriverId = null;
//         let yangoError = null;

//         try {
//             if (!process.env.YANGO_API_KEY || !process.env.YANGO_CLIENT_ID || !process.env.YANGO_PARK_ID) {
//                 throw new Error("Yango credentials not configured");
//             }

//             // 3a. Create car in Yango (handle duplicate)
//             console.log("🚗 Creating car in Yango...");
//             try {
//                 const carSyncResult = await yangoService.createCarInYango(carForYango);
//                 if (carSyncResult && carSyncResult.vehicle_id) {
//                     yangoCarId = carSyncResult.vehicle_id;
//                     console.log(`✅ Car created in Yango: ${yangoCarId}`);
//                 } else {
//                     throw new Error("Car sync failed - no vehicle_id returned");
//                 }
//             } catch (carError) {
//                 // ✅ Handle duplicate car error
//                 if (carError.response?.data?.code === 'car_number_duplicate') {
//                     const existingCarId = carError.response?.data?.car_id;
//                     if (existingCarId) {
//                         console.log(`ℹ️ Car already exists in Yango with ID: ${existingCarId}`);
//                         yangoCarId = existingCarId;
//                         console.log(`✅ Using existing car ID: ${yangoCarId}`);
//                     } else {
//                         throw carError;
//                     }
//                 } else {
//                     throw carError;
//                 }
//             }

//             // 3b. Create OR Update driver in Yango
//             if (existingYangoDriverId) {
//                 // ✅ UPDATE existing driver
//                 console.log(`👤 Updating existing driver in Yango: ${existingYangoDriverId}`);
//                 await yangoService.updateDriverInYango(
//                     existingYangoDriverId,
//                     {
//                         ...driverForYango,
//                         work_status: 'working' // Change status to working
//                     }
//                 );
//                 yangoDriverId = existingYangoDriverId;
//                 console.log(`✅ Driver updated in Yango: ${yangoDriverId}`);
//             } else {
//                 // ✅ CREATE new driver
//                 console.log("👤 Creating driver in Yango...");
//                 const driverSyncResult = await yangoService.createDriverInYango(driverForYango, yangoCarId);
//                 if (!driverSyncResult || !driverSyncResult.contractor_profile_id) {
//                     throw new Error("Driver sync failed - no contractor_profile_id returned");
//                 }
//                 yangoDriverId = driverSyncResult.contractor_profile_id;
//                 console.log(`✅ Driver created in Yango: ${yangoDriverId}`);
//             }

//             // 3c. Create binding in Yango
//             console.log("🔗 Creating binding in Yango...");
//             await yangoService.bindCarToDriverInYango(yangoCarId, yangoDriverId);
//             console.log(`✅ Binding created in Yango`);

//         } catch (error) {
//             console.error("❌ Yango sync failed:", error.message);
//             yangoError = error.message;
            
//             // If car was created but driver failed, try to delete the car
//             if (yangoCarId && !yangoDriverId) {
//                 console.log(`⚠️ Car ${yangoCarId} was created in Yango but driver creation failed.`);
//                 console.log(`🔄 Attempting to delete orphaned car...`);
                
//                 try {
//                     await yangoService.deleteCarInYango(yangoCarId);
//                     console.log(`✅ Orphaned car deleted from Yango`);
//                 } catch (deleteError) {
//                     console.error(`❌ Failed to delete orphaned car:`, deleteError.message);
//                     console.log(`⚠️ Manual cleanup needed for car: ${yangoCarId}`);
//                 }
//             }
            
//             return res.status(400).json({
//                 success: false,
//                 message: "Registration failed: Could not sync with Yango. No local records were created.",
//                 error: yangoError,
//                 yango_synced: false,
//                 step: "yango_sync",
//                 yango_car_id: yangoCarId || undefined,
//                 note: yangoCarId ? "Car was created in Yango but registration failed. Manual cleanup may be needed." : undefined
//             });
//         }

//         // ==========================================
//         // STEP 4: Save Locally (Phase 2)
//         // ==========================================
//         console.log("✅ Yango sync successful. Saving locally...");
        
//         await client.query('BEGIN');

//         try {
//             // 4a. Create car locally
//             console.log("💾 Creating car locally...");
//             const carData = await carModel.createCar({
//                 ...car,
//                 yango_vehicle_id: yangoCarId,
//                 yango_synced: true
//             });
//             console.log(`✅ Car saved locally with ID: ${carData.id}`);

//             // 4b. Check if driver already exists locally
//             let driverData;
//             const existingLocalDriver = await driverModel.getDriverByYangoId(yangoDriverId);
            
//         // In updateRegistration function - STEP 1: Update driver

// if (existingLocalDriver) {
//     console.log(`👤 Updating existing local driver: ${existingLocalDriver.id}`);
//     updatedDriver = await driverModel.updateDriver(existingLocalDriver.id, {
//         ...driver,
//         yango_driver_id: yangoDriverId,
//         yango_synced: true  // ← Explicitly set to true
//     });
//     console.log(`✅ Driver updated locally with ID: ${updatedDriver.id}`);
// } else {
//     console.log(`👤 Creating new local driver from Yango data`);
//     updatedDriver = await driverModel.createDriver({
//         ...driver,
//         yango_driver_id: yangoDriverId,
//         yango_synced: true  // ← Explicitly set to true
//     });
//     console.log(`✅ Driver created locally with ID: ${updatedDriver.id}`);
// }

// // After updating Yango, explicitly update the sync status
// try {
//     console.log("☁️ Updating driver in Yango...");
//     await yangoService.updateDriverInYango(
//         yangoDriverId,
//         {
//             ...driver,
//             work_status: 'working'
//         }
//     );
//     console.log('✅ Driver updated in Yango');
    
//     // ✅ Explicitly update sync status
//     if (updatedDriver) {
//         console.log(`💾 Setting yango_synced = TRUE for driver: ${updatedDriver.id}`);
//         const result = await client.query(
//             `UPDATE drivers 
//              SET yango_synced = TRUE, 
//                  yango_sync_error = NULL,
//                  yango_last_synced_at = NOW()
//              WHERE id = $1
//              RETURNING *`,
//             [updatedDriver.id]
//         );
//         updatedDriver = result.rows[0];
//         console.log(`✅ yango_synced is now: ${updatedDriver.yango_synced}`);
//     }
    
// } catch (yangoError) {
//     console.error('❌ Yango driver update failed:', yangoError.message);
// }
//             // 4c. Create binding locally (handle existing binding)
//             console.log("💾 Creating binding locally...");
            
//             // ✅ Check if binding already exists for this driver
//             const existingBinding = await client.query(
//                 `SELECT * FROM car_driver_bindings 
//                  WHERE driver_id = $1 AND is_active = TRUE`,
//                 [driverData.id]
//             );

//             let bindingData;
//             if (existingBinding.rows.length > 0) {
//                 // ✅ Deactivate existing binding (remove updated_at column)
//                 console.log(`🔄 Deactivating existing binding: ${existingBinding.rows[0].id}`);
//                 await client.query(
//                     `UPDATE car_driver_bindings 
//                      SET is_active = FALSE
//                      WHERE id = $1`,
//                     [existingBinding.rows[0].id]
//                 );
//                 console.log(`✅ Existing binding deactivated`);
//             }

//             // ✅ Create new binding
//             const bindingResult = await client.query(
//                 `INSERT INTO car_driver_bindings (car_id, driver_id, is_active)
//                  VALUES ($1, $2, $3)
//                  RETURNING *`,
//                 [carData.id, driverData.id, true]
//             );
//             bindingData = bindingResult.rows[0];
//             console.log(`✅ Binding saved locally with ID: ${bindingData.id}`);

//             // Update binding with Yango sync status
//             await bindingModel.updateYangoInfo(bindingData.id, true);
// // In createFullRegistration - STEP 4d: Create or update registration
// // After creating/updating registration, mark it as synced

// // 4d. Create or update registration
// console.log("💾 Creating/updating registration locally...");

// const existingRegistration = await registrationModel.getRegistrationByDriverId(driverData.id);

// let registrationData;
// if (existingRegistration) {
//     registrationData = await registrationModel.updateRegistration({
//         id: existingRegistration.id,
//         car_id: carData.id,
//         driver_id: driverData.id,
//         status: 'completed'
//     });
//     console.log(`✅ Registration updated locally with ID: ${registrationData.id}`);
// } else {
//     registrationData = await registrationModel.createRegistration({
//         car_id: carData.id,
//         driver_id: driverData.id,
//         sales_employee_id: sales_employee_id,
//         status: 'completed'
//     });
//     console.log(`✅ Registration saved locally with ID: ${registrationData.id}`);
// }

// // ✅ Update registration with Yango sync status
// await registrationModel.updateYangoSyncStatus(registrationData.id, true, null);
// console.log(`✅ Registration YANGO sync status updated to TRUE`);

//             // Update registration with Yango sync status
//             await registrationModel.updateYangoSyncStatus(registrationData.id, true, null);

//             await client.query('COMMIT');
//             console.log(`🎉 Registration complete: COMPLETED`);

//             const completeRegistration = await registrationModel.getRegistrationById(registrationData.id);

//             res.status(201).json({
//                 success: true,
//                 message: "Registration completed successfully with Yango sync",
//                 data: {
//                     registration: completeRegistration,
//                     car: carData,
//                     driver: driverData,
//                     binding: bindingData,
//                     yango_synced: true,
//                     yango_car_id: yangoCarId,
//                     yango_driver_id: yangoDriverId,
//                     mode: existingYangoDriverId ? 'update' : 'create'
//                 }
//             });

//         } catch (error) {
//             await client.query('ROLLBACK');
//             console.error("❌ Local save failed:", error.message);
            
//             res.status(500).json({
//                 success: false,
//                 message: "Registration partially failed: Yango sync succeeded but local save failed.",
//                 error: error.message,
//                 yango_synced: true,
//                 yango_car_id: yangoCarId,
//                 yango_driver_id: yangoDriverId,
//                 note: "Yango records were created successfully. Please check your local database connection and try again."
//             });
//         }

//     } catch (error) {
//         await client.query('ROLLBACK');
//         console.error("❌ Registration error:", error);
//         res.status(500).json({
//             success: false,
//             message: "Failed to complete registration",
//             error: error.message
//         });
//     } finally {
//         client.release();
//     }
// };
// ==========================================
// CREATE FULL REGISTRATION (Two-Phase Commit)
// ==========================================

const createFullRegistration = async (req, res) => {
    const client = await pool.connect();
    
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

        // ✅ STRICT VALIDATION: License number is REQUIRED, no generation
        if (!driver.first_name || !driver.last_name) {
            return res.status(400).json({
                success: false,
                message: "driver first_name and last_name are required"
            });
        }

        // ✅ License number must be provided and valid
        if (!driver.license_number || driver.license_number.trim().length < 4) {
            return res.status(400).json({
                success: false,
                message: "Valid license_number is required (minimum 4 characters)"
            });
        }

        // ✅ REQUIRED: license_issue_date must be provided
        if (!driver.license_issue_date) {
            return res.status(400).json({
                success: false,
                message: "driver license_issue_date is required"
            });
        }

        // ✅ REQUIRED: birth_date must be provided
        if (!driver.birth_date) {
            return res.status(400).json({
                success: false,
                message: "driver birth_date is required"
            });
        }

        console.log(`📝 Starting registration by employee: ${sales_employee_id}`);

        // ==========================================
        // STEP 1: Calculate Derived Fields
        // ==========================================
        const calculateExpiryDate = (issueDate) => {
            if (!issueDate) return null;
            const d = new Date(issueDate);
            d.setFullYear(d.getFullYear() + 2);
            return d.toISOString().split('T')[0];
        };

        const today = new Date().toISOString().split('T')[0];

        // Prepare driver data for Yango
        const driverForYango = {
            ...driver,
            license_expiry_date: driver.license_expiry_date || calculateExpiryDate(driver.license_issue_date),
            hire_date: driver.hire_date || today,
            driving_experience_since: driver.driving_experience_since || driver.license_issue_date
        };

        const carForYango = { ...car };

        // ==========================================
        // STEP 2: CHECK IF DRIVER EXISTS IN YANGO
        // ==========================================
        let existingYangoDriver = null;
        let existingYangoDriverId = null;
        
        if (driver.phone) {
            console.log(`🔍 Checking if driver ${driver.phone} exists in Yango...`);
            try {
                const driverResult = await yangoService.searchDriverByPhone(driver.phone);
                
                if (driverResult?.exists) {
                    existingYangoDriver = driverResult;
                    existingYangoDriverId = driverResult.id;
                    console.log(`📱 Driver exists in Yango with ID: ${existingYangoDriverId}, status: ${driverResult.work_status}`);
                    
                    // If driver is working, block registration
                    if (driverResult.work_status === "working") {
                        return res.status(409).json({
                            success: false,
                            message: "Driver is already active in Yango. Cannot register.",
                            conflict_type: "active_driver",
                            driver_id: driverResult.id,
                            work_status: driverResult.work_status
                        });
                    }
                }
            } catch (searchError) {
                console.error('❌ Error checking driver existence:', searchError.message);
                // Continue with creation if search fails
            }
        }

        // ==========================================
        // STEP 3: Try Yango Sync
        // ==========================================
        console.log("☁️ Attempting Yango sync...");
        let yangoCarId = null;
        let yangoDriverId = null;
        let yangoError = null;

        try {
            if (!process.env.YANGO_API_KEY || !process.env.YANGO_CLIENT_ID || !process.env.YANGO_PARK_ID) {
                throw new Error("Yango credentials not configured");
            }

            // 3a. Create car in Yango (handle duplicate)
            console.log("🚗 Creating car in Yango...");
            try {
                const carSyncResult = await yangoService.createCarInYango(carForYango);
                if (carSyncResult && carSyncResult.vehicle_id) {
                    yangoCarId = carSyncResult.vehicle_id;
                    console.log(`✅ Car created in Yango: ${yangoCarId}`);
                } else {
                    throw new Error("Car sync failed - no vehicle_id returned");
                }
            } catch (carError) {
                // ✅ Handle duplicate car error
                if (carError.response?.data?.code === 'car_number_duplicate') {
                    const existingCarId = carError.response?.data?.car_id;
                    if (existingCarId) {
                        console.log(`ℹ️ Car already exists in Yango with ID: ${existingCarId}`);
                        yangoCarId = existingCarId;
                        console.log(`✅ Using existing car ID: ${yangoCarId}`);
                    } else {
                        throw carError;
                    }
                } else {
                    throw carError;
                }
            }

            // 3b. Create OR Update driver in Yango
            if (existingYangoDriverId) {
                // ✅ UPDATE existing driver
                console.log(`👤 Updating existing driver in Yango: ${existingYangoDriverId}`);
                await yangoService.updateDriverInYango(
                    existingYangoDriverId,
                    {
                        ...driverForYango,
                        work_status: 'working' // Change status to working
                    }
                );
                yangoDriverId = existingYangoDriverId;
                console.log(`✅ Driver updated in Yango: ${yangoDriverId}`);
            } else {
                // ✅ CREATE new driver
                console.log("👤 Creating driver in Yango...");
                const driverSyncResult = await yangoService.createDriverInYango(driverForYango, yangoCarId);
                if (!driverSyncResult || !driverSyncResult.contractor_profile_id) {
                    throw new Error("Driver sync failed - no contractor_profile_id returned");
                }
                yangoDriverId = driverSyncResult.contractor_profile_id;
                console.log(`✅ Driver created in Yango: ${yangoDriverId}`);
            }

            // 3c. Create binding in Yango
            console.log("🔗 Creating binding in Yango...");
            await yangoService.bindCarToDriverInYango(yangoCarId, yangoDriverId);
            console.log(`✅ Binding created in Yango`);

        } catch (error) {
            console.error("❌ Yango sync failed:", error.message);
            yangoError = error.message;
            
            // If car was created but driver failed, try to delete the car
            if (yangoCarId && !yangoDriverId) {
                console.log(`⚠️ Car ${yangoCarId} was created in Yango but driver creation failed.`);
                console.log(`🔄 Attempting to delete orphaned car...`);
                
                try {
                    await yangoService.deleteCarInYango(yangoCarId);
                    console.log(`✅ Orphaned car deleted from Yango`);
                } catch (deleteError) {
                    console.error(`❌ Failed to delete orphaned car:`, deleteError.message);
                    console.log(`⚠️ Manual cleanup needed for car: ${yangoCarId}`);
                }
            }
            
            return res.status(400).json({
                success: false,
                message: "Registration failed: Could not sync with Yango. No local records were created.",
                error: yangoError,
                yango_synced: false,
                step: "yango_sync",
                yango_car_id: yangoCarId || undefined,
                note: yangoCarId ? "Car was created in Yango but registration failed. Manual cleanup may be needed." : undefined
            });
        }

        // ==========================================
        // STEP 4: Save Locally (Phase 2)
        // ==========================================
        console.log("✅ Yango sync successful. Saving locally...");
        
        await client.query('BEGIN');

        try {
            // 4a. Create car locally
            console.log("💾 Creating car locally...");
            const carData = await carModel.createCar({
                ...car,
                yango_vehicle_id: yangoCarId,
                yango_synced: true
            });
            console.log(`✅ Car saved locally with ID: ${carData.id}`);

            // 4b. Check if driver already exists locally
            let driverData;
            const existingLocalDriver = await driverModel.getDriverByYangoId(yangoDriverId);

            if (existingLocalDriver) {
                console.log(`👤 Updating existing local driver: ${existingLocalDriver.id}`);
                driverData = await driverModel.updateDriver(existingLocalDriver.id, {
                    ...driver,
                    yango_driver_id: yangoDriverId,
                    yango_synced: true
                });
                console.log(`✅ Driver updated locally with ID: ${driverData.id}`);
            } else {
                console.log(`👤 Creating new local driver from Yango data`);
                driverData = await driverModel.createDriver({
                    ...driver,
                    yango_driver_id: yangoDriverId,
                    yango_synced: true
                });
                console.log(`✅ Driver created locally with ID: ${driverData.id}`);
            }

            // After updating Yango, explicitly update the sync status
            try {
                console.log("☁️ Updating driver in Yango...");
                await yangoService.updateDriverInYango(
                    yangoDriverId,
                    {
                        ...driver,
                        work_status: 'working'
                    }
                );
                console.log('✅ Driver updated in Yango');
                
                if (driverData) {
                    console.log(`💾 Setting yango_synced = TRUE for driver: ${driverData.id}`);
                    const result = await client.query(
                        `UPDATE drivers 
                         SET yango_synced = TRUE, 
                             yango_sync_error = NULL,
                             yango_last_synced_at = NOW()
                         WHERE id = $1
                         RETURNING *`,
                        [driverData.id]
                    );
                    driverData = result.rows[0];
                    console.log(`✅ yango_synced is now: ${driverData.yango_synced}`);
                }
            } catch (yangoError) {
                console.error('❌ Yango driver update failed:', yangoError.message);
            }

            // // 4c. Create binding locally
            // console.log("💾 Creating binding locally...");
            
            // const existingBinding = await client.query(
            //     `SELECT * FROM car_driver_bindings 
            //      WHERE driver_id = $1 AND is_active = TRUE`,
            //     [driverData.id]
            // );

            // let bindingData;
            // if (existingBinding.rows.length > 0) {
            //     console.log(`🔄 Deactivating existing binding: ${existingBinding.rows[0].id}`);
            //     await client.query(
            //         `UPDATE car_driver_bindings 
            //          SET is_active = FALSE
            //          WHERE id = $1`,
            //         [existingBinding.rows[0].id]
            //     );
            //     console.log(`✅ Existing binding deactivated`);
            // }

            // const bindingResult = await client.query(
            //     `INSERT INTO car_driver_bindings (car_id, driver_id, is_active)
            //      VALUES ($1, $2, $3)
            //      RETURNING *`,
            //     [carData.id, driverData.id, true]
            // );
            // bindingData = bindingResult.rows[0];
            // console.log(`✅ Binding saved locally with ID: ${bindingData.id}`);

            // await bindingModel.updateYangoInfo(bindingData.id, true);
// 4c. Create binding locally - FIXED
            console.log("💾 Creating binding locally...");
            
            let bindingData;
            
            // ✅ Check if binding already exists for this driver
            const existingBinding = await client.query(
                `SELECT * FROM car_driver_bindings 
                 WHERE driver_id = $1 AND is_active = TRUE`,
                [driverData.id]
            );

            if (existingBinding.rows.length > 0) {
                console.log(`🔄 Deactivating existing binding: ${existingBinding.rows[0].id}`);
                await client.query(
                    `UPDATE car_driver_bindings 
                     SET is_active = FALSE,
                         unbound_at = NOW()
                     WHERE id = $1`,
                    [existingBinding.rows[0].id]
                );
                console.log(`✅ Existing binding deactivated`);
            }

            // ✅ Create new binding
            const bindingResult = await client.query(
                `INSERT INTO car_driver_bindings (car_id, driver_id, is_active, bound_at)
                 VALUES ($1, $2, $3, NOW())
                 RETURNING *`,
                [carData.id, driverData.id, true]
            );
            bindingData = bindingResult.rows[0];
            console.log(`✅ Binding saved locally with ID: ${bindingData.id}`);

            // ✅ IMPORTANT: Update binding with Yango sync status
            try {
                // Since Yango binding was already created successfully in STEP 3,
                // we just need to mark it as synced locally
                const updateResult = await client.query(
                    `UPDATE car_driver_bindings 
                     SET yango_synced = TRUE, 
                         yango_sync_error = NULL,
                         yango_last_synced_at = NOW()
                     WHERE id = $1
                     RETURNING *`,
                    [bindingData.id]
                );
                bindingData = updateResult.rows[0];
                console.log(`✅ Binding YANGO sync status updated to TRUE`);
            } catch (bindingSyncError) {
                console.error('❌ Failed to update binding sync status:', bindingSyncError.message);
                // Don't fail the whole operation - binding was created locally
            }

//             // 4d. Create or update registration
//             console.log("💾 Creating/updating registration locally...");

//             const existingRegistration = await registrationModel.getRegistrationByDriverId(driverData.id);

//             let registrationData;
//             if (existingRegistration) {
//                 registrationData = await registrationModel.updateRegistration({
//                     id: existingRegistration.id,
//                     car_id: carData.id,
//                     driver_id: driverData.id,
//                     status: 'completed'
//                 });
//                 console.log(`✅ Registration updated locally with ID: ${registrationData.id}`);
//             } else {
//                 registrationData = await registrationModel.createRegistration({
//                     car_id: carData.id,
//                     driver_id: driverData.id,
//                     sales_employee_id: sales_employee_id,
//                     status: 'completed'
//                 });
//                 console.log(`✅ Registration saved locally with ID: ${registrationData.id}`);
//             }

//             await registrationModel.updateYangoSyncStatus(registrationData.id, true, null);
//             console.log(`✅ Registration YANGO sync status updated to TRUE`);

//             await client.query('COMMIT');
//             console.log(`🎉 Registration complete: COMPLETED`);

//             const completeRegistration = await registrationModel.getRegistrationById(registrationData.id);

//             res.status(201).json({
//                 success: true,
//                 message: "Registration completed successfully with Yango sync",
//                 data: {
//                     registration: completeRegistration,
//                     car: carData,
//                     driver: driverData,
//                     binding: bindingData,
//                     yango_synced: true,
//                     yango_car_id: yangoCarId,
//                     yango_driver_id: yangoDriverId,
//                     mode: existingYangoDriverId ? 'update' : 'create'
//                 }
//             });

//         } catch (error) {
//             await client.query('ROLLBACK');
//             console.error("❌ Local save failed:", error.message);
            
//             res.status(500).json({
//                 success: false,
//                 message: "Registration partially failed: Yango sync succeeded but local save failed.",
//                 error: error.message,
//                 yango_synced: true,
//                 yango_car_id: yangoCarId,
//                 yango_driver_id: yangoDriverId,
//                 note: "Yango records were created successfully. Please check your local database connection and try again."
//             });
//         }

//     } catch (error) {
//         await client.query('ROLLBACK');
//         console.error("❌ Registration error:", error);
//         res.status(500).json({
//             success: false,
//             message: "Failed to complete registration",
//             error: error.message
//         });
//     } finally {
//         client.release();
//     }
// };
// 4d. Create or update registration
            console.log("💾 Creating/updating registration locally...");

            const existingRegistration = await registrationModel.getRegistrationByDriverId(driverData.id);

            let registrationData;
            if (existingRegistration) {
                registrationData = await registrationModel.updateRegistration({
                    id: existingRegistration.id,
                    car_id: carData.id,
                    driver_id: driverData.id,
                    status: 'completed'
                });
                console.log(`✅ Registration updated locally with ID: ${registrationData.id}`);
            } else {
                registrationData = await registrationModel.createRegistration({
                    car_id: carData.id,
                    driver_id: driverData.id,
                    sales_employee_id: sales_employee_id,
                    status: 'completed'
                });
                console.log(`✅ Registration saved locally with ID: ${registrationData.id}`);
            }

            await registrationModel.updateYangoSyncStatus(registrationData.id, true, null);
            console.log(`✅ Registration YANGO sync status updated to TRUE`);

            await client.query('COMMIT');
            console.log(`🎉 Registration complete: COMPLETED`);

            const completeRegistration = await registrationModel.getRegistrationById(registrationData.id);

            res.status(201).json({
                success: true,
                message: "Registration completed successfully with Yango sync",
                data: {
                    registration: completeRegistration,
                    car: carData,
                    driver: driverData,
                    binding: bindingData,
                    yango_synced: true,
                    yango_car_id: yangoCarId,
                    yango_driver_id: yangoDriverId,
                    mode: existingYangoDriverId ? 'update' : 'create'
                }
            });

        } catch (error) {
            await client.query('ROLLBACK');
            console.error("❌ Local save failed:", error.message);
            
            res.status(500).json({
                success: false,
                message: "Registration partially failed: Yango sync succeeded but local save failed.",
                error: error.message,
                yango_synced: true,
                yango_car_id: yangoCarId,
                yango_driver_id: yangoDriverId,
                note: "Yango records were created successfully. Please check your local database connection and try again."
            });
        }

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("❌ Registration error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to complete registration",
            error: error.message
        });
    } finally {
        client.release();
    }
};
// ==========================================
// GET ALL REGISTRATIONS
// ==========================================

const getRegistrations = async (req, res) => {
    try {
        const { status, employee_id, car_id, driver_id, yango_synced } = req.query;
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
// ==========================================

const getAllRegistrationsForAdmin = async (req, res) => {
    try {
        console.log('📊 GET /api/registrations/admin/all - Fetching all registrations for admin');
        
        const registrations = await registrationModel.getAllRegistrations({});

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
// ==========================================
// CHECK AVAILABILITY USING YANGO TEXT SEARCH
// ==========================================

const checkAvailability = async (req, res) => {
    try {
        const { phone, license_plate } = req.body;

        if (!phone && !license_plate) {
            return res.status(400).json({
                success: false,
                message: "Either phone number or license plate is required"
            });
        }

        // ==========================================
        // STEP 1: CHECK DRIVER BY PHONE
        // ==========================================
        if (phone) {
            console.log(`📱 Searching driver by phone: ${phone}`);

            const driverResult = await yangoService.searchDriverByPhone(phone);

            if (driverResult?.exists) {
                console.log(`📱 Driver found: ${driverResult.id}, status: ${driverResult.work_status}`);

                // ==========================================
                // ACTIVE DRIVER - BLOCK
                // ==========================================
                if (driverResult.work_status === "working") {
                    return res.status(409).json({
                        success: false,
                        message: "Driver is already registered and active in Yango",
                        conflict_type: "active_driver",
                        driver_id: driverResult.id,
                        work_status: driverResult.work_status,
                        action: "blocked",
                        mode: "blocked"
                    });
                }

                // ==========================================
                // FIRED OR NOT_WORKING - UPDATE MODE
                // ==========================================
                if (
                    driverResult.work_status === "fired" ||
                    driverResult.work_status === "not_working"
                ) {
                    return res.status(200).json({
                        success: true,
                        message: "Driver already exists but is not active. Proceed to update.",
                        conflict_type: "update_driver",
                        driver_id: driverResult.id,
                        work_status: driverResult.work_status,
                        driver_data: driverResult.fullData,
                        action: "update",
                        mode: "update"
                    });
                }
            }

            console.log(`📱 Driver ${phone} not found. Proceed to create.`);
        }

        // ==========================================
        // STEP 2: CHECK CAR BY LICENSE PLATE
        // ==========================================
        if (license_plate) {
            console.log(`🚗 Searching vehicle by license plate: ${license_plate}`);

            const carResult = await yangoService.searchCarByLicensePlate(license_plate);

            if (carResult?.exists) {
                console.log(`🚗 Vehicle found: ${carResult.id}`);

                // If vehicle has a driver, block it
                if (carResult.driver_profile_id) {
                    return res.status(409).json({
                        success: false,
                        message: "Car is already registered and bound to a driver in Yango",
                        conflict_type: "active_car",
                        car_id: carResult.id,
                        action: "blocked",
                        mode: "blocked"
                    });
                }

                // Existing car without active driver
                return res.status(200).json({
                    success: true,
                    message: "Car already exists but is not bound to a driver. Proceed to update.",
                    conflict_type: "update_car",
                    car_id: carResult.id,
                    car_data: carResult.fullData,
                    action: "update",
                    mode: "update"
                });
            }

            console.log(`🚗 License plate ${license_plate} not found. Proceed to create.`);
        }

        // ==========================================
        // STEP 3: NOTHING FOUND
        // ==========================================
        return res.status(200).json({
            success: true,
            message: "No existing records found. Proceed to create.",
            action: "create",
            mode: "create"
        });

    } catch (error) {
        console.error("❌ Check availability error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to check availability",
            error: error.message
        });
    }
};
// In registrationController.js, add this function:



// registrationController.js

// ==========================================
// UPDATE EXISTING REGISTRATION
// ==========================================

// registrationController.js

// ==========================================
// UPDATE EXISTING REGISTRATION
// ==========================================

// registrationController.js

// registrationController.js

// ==========================================
// UPDATE EXISTING REGISTRATION
// ==========================================

// const updateRegistration = async (req, res) => {
//     console.log('🔄 Update registration called');
//     console.log('📝 Params:', req.params);
//     console.log('📝 Body:', req.body);
    
//     const client = await pool.connect();
    
//     try {
//         const { driver_id } = req.params;
        
//         if (!driver_id) {
//             return res.status(400).json({
//                 success: false,
//                 message: "driver_id is required"
//             });
//         }

//         const { car, driver } = req.body;

//         console.log(`📝 Updating registration for driver: ${driver_id}`);

//         // ==========================================
//         // STEP 1: Find existing driver in LOCAL database
//         // ==========================================
//         let existingLocalDriver = await driverModel.getDriverByYangoId(driver_id);
        
//         // If not found by yango_driver_id, try by phone
//         if (!existingLocalDriver && driver.phone) {
//             console.log(`🔍 Searching for driver by phone: ${driver.phone}`);
//             // Get all drivers and filter by phone (since we don't have a getByPhone function)
//             const allDrivers = await driverModel.getAllDrivers({});
//             existingLocalDriver = allDrivers.find(d => d.phone === driver.phone);
//             if (existingLocalDriver) {
//                 console.log(`✅ Found existing driver by phone: ${existingLocalDriver.id}`);
//             }
//         }
        
//         // If still not found, try by ID
//         if (!existingLocalDriver) {
//             existingLocalDriver = await driverModel.getDriverById(driver_id);
//         }

//         let updatedDriver;

//         if (existingLocalDriver) {
//             // ✅ Driver exists locally - UPDATE
//             console.log(`👤 Updating existing local driver: ${existingLocalDriver.id}`);
//             updatedDriver = await driverModel.updateDriver(existingLocalDriver.id, {
//                 ...driver,
//                 yango_driver_id: driver_id,
//                 yango_synced: true
//             });
//             console.log(`✅ Driver updated locally with ID: ${updatedDriver.id}`);
//         } else {
//             // ✅ Driver doesn't exist locally - CREATE
//             console.log(`👤 Creating new local driver from Yango data`);
//             updatedDriver = await driverModel.createDriver({
//                 ...driver,
//                 yango_driver_id: driver_id,
//                 yango_synced: true
//             });
//             console.log(`✅ Driver created locally with ID: ${updatedDriver.id}`);
//         }

//         // In updateRegistration function - after updating driver in Yango

// // ==========================================
// // STEP 2: Update driver in Yango
// // ==========================================
// try {
//     console.log("☁️ Updating driver in Yango...");
//     await yangoService.updateDriverInYango(
//         driver_id,
//         {
//             ...driver,
//             work_status: 'working'
//         }
//     );
//     console.log('✅ Driver updated in Yango');
    
//     // ✅ IMPORTANT: Make sure yango_driver_id is saved in local DB
//     // The driver_id from params IS the Yango driver ID
//     if (updatedDriver && !updatedDriver.yango_driver_id) {
//         console.log(`💾 Saving Yango driver ID to local DB: ${driver_id}`);
//         await driverModel.updateYangoInfo(updatedDriver.id, driver_id);
//         // Refresh the driver data
//         updatedDriver = await driverModel.getDriverById(updatedDriver.id);
//         console.log(`✅ Yango driver ID saved: ${updatedDriver.yango_driver_id}`);
//     }
    
// } catch (yangoError) {
//     console.error('❌ Yango driver update failed:', yangoError.message);
//     // Don't fail the whole operation
// }

//        // In updateRegistration function - STEP 3: Handle Car Update

// // ==========================================
// // STEP 3: Handle Car Update
// // ==========================================
// let updatedCar = null;
// let carId = null;

// if (car) {
//     // Check if car exists locally by license plate
//     const existingCar = await carModel.getCarByLicensePlate(car.license_plate_number);
    
//     if (existingCar) {
//         console.log(`🚗 Updating existing car locally: ${existingCar.id}`);
//         updatedCar = await carModel.updateCar(existingCar.id, car);
//         carId = updatedCar.id;
//         console.log(`✅ Car updated locally with ID: ${carId}`);
//     } else {
//         console.log("🚗 Creating new car locally...");
//         updatedCar = await carModel.createCar({
//             ...car,
//             yango_synced: true
//         });
//         carId = updatedCar.id;
//         console.log(`✅ New car created locally with ID: ${carId}`);
//     }

//     // ✅ Check if car already has a Yango ID
//     if (updatedCar.yango_vehicle_id) {
//         // Car already has Yango ID, update it
//         try {
//             console.log(`☁️ Updating existing car in Yango: ${updatedCar.yango_vehicle_id}`);
//             await yangoService.updateCarInYango(updatedCar.yango_vehicle_id, car);
//             console.log('✅ Car updated in Yango');
//         } catch (yangoError) {
//             console.error('❌ Yango car update failed:', yangoError.message);
//         }
//     } else {
//         // Try to create car in Yango
//         try {
//             console.log("☁️ Creating car in Yango...");
//             const carSyncResult = await yangoService.createCarInYango(car);
//             if (carSyncResult && carSyncResult.vehicle_id) {
//                 await carModel.updateYangoInfo(carId, carSyncResult.vehicle_id);
//                 console.log(`✅ Car created in Yango with ID: ${carSyncResult.vehicle_id}`);
//             }
//         } catch (yangoError) {
//             console.error('❌ Yango car creation failed:', yangoError.message);
            
//             // ✅ Handle duplicate car error
//             if (yangoError.response?.data?.code === 'car_number_duplicate') {
//                 const existingCarId = yangoError.response?.data?.car_id;
//                 if (existingCarId) {
//                     console.log(`ℹ️ Car already exists in Yango with ID: ${existingCarId}`);
//                     await carModel.updateYangoInfo(carId, existingCarId);
//                     console.log('✅ Updated local car with existing Yango ID');
//                 }
//             }
//         }
//     }
// }
//   // ==========================================
// // STEP 4: Create or Update Binding
// // ==========================================
// let bindingData = null;
// if (carId) {
//     console.log("🔗 Creating/updating binding...");
    
//     // ✅ Check if binding already exists for this driver
//     const existingBinding = await client.query(
//         `SELECT * FROM car_driver_bindings 
//          WHERE driver_id = $1 AND is_active = TRUE`,
//         [updatedDriver.id]
//     );
    
//     if (existingBinding.rows.length > 0) {
//         // ✅ Deactivate the existing binding
//         // ❌ REMOVE "updated_at" from the query
//         console.log(`🔄 Deactivating existing binding: ${existingBinding.rows[0].id}`);
//         await client.query(
//             `UPDATE car_driver_bindings 
//              SET is_active = FALSE
//              WHERE id = $1`,
//             [existingBinding.rows[0].id]
//         );
//         console.log(`✅ Existing binding deactivated`);
//     }
    
//     // ✅ Create new binding
//     const bindingResult = await client.query(
//         `INSERT INTO car_driver_bindings (car_id, driver_id, is_active)
//          VALUES ($1, $2, $3)
//          RETURNING *`,
//         [carId, updatedDriver.id, true]
//     );
//     bindingData = bindingResult.rows[0];
//     console.log(`✅ New binding created with ID: ${bindingData.id}`);
// }

//         // ==========================================
//         // STEP 5: Create or Update Registration
//         // ==========================================
//         console.log("📋 Creating/updating registration...");
        
//         const existingRegistration = await registrationModel.getRegistrationByDriverId(updatedDriver.id);
        
//         let registrationData;
//         if (existingRegistration) {
//             registrationData = await registrationModel.updateRegistration({
//                 id: existingRegistration.id,
//                 car_id: carId || existingRegistration.car_id,
//                 driver_id: updatedDriver.id,
//                 status: 'completed'
//             });
//             console.log(`✅ Registration updated with ID: ${registrationData.id}`);
//         } else {
//             registrationData = await registrationModel.createRegistration({
//                 car_id: carId || null,
//                 driver_id: updatedDriver.id,
//                 sales_employee_id: req.employeeId,
//                 status: 'completed'
//             });
//             console.log(`✅ Registration created with ID: ${registrationData.id}`);
//         }

//         // ==========================================
//         // STEP 6: Commit transaction
//         // ==========================================
//         await client.query('COMMIT');

//         // ==========================================
//         // STEP 7: Get complete registration
//         // ==========================================
//         const completeRegistration = await registrationModel.getRegistrationById(registrationData.id);

//         console.log(`🎉 Registration update complete`);

//         return res.status(200).json({
//             success: true,
//             message: "Registration updated successfully",
//             data: {
//                 registration: completeRegistration,
//                 driver: updatedDriver,
//                 car: updatedCar,
//                 binding: bindingData
//             }
//         });

//     } catch (error) {
//         await client.query('ROLLBACK');
//         console.error("❌ Update registration error:", error);
//         return res.status(500).json({
//             success: false,
//             message: "Failed to update registration",
//             error: error.message
//         });
//     } finally {
//         client.release();
//     }
// };
// ==========================================
// UPDATE EXISTING REGISTRATION
// ==========================================

const updateRegistration = async (req, res) => {
    console.log('🔄 Update registration called');
    console.log('📝 Params:', req.params);
    console.log('📝 Body:', req.body);
    
    const client = await pool.connect();
    
    try {
        const { driver_id } = req.params;
        
        if (!driver_id) {
            return res.status(400).json({
                success: false,
                message: "driver_id is required"
            });
        }

        const { car, driver } = req.body;

        console.log(`📝 Updating registration for driver: ${driver_id}`);

        // ==========================================
        // START TRANSACTION
        // ==========================================
        await client.query('BEGIN');

        // ==========================================
        // STEP 1: Find existing driver in LOCAL database
        // ==========================================
        let existingLocalDriver = await driverModel.getDriverByYangoId(driver_id);
        
        if (!existingLocalDriver && driver.phone) {
            console.log(`🔍 Searching for driver by phone: ${driver.phone}`);
            const allDrivers = await driverModel.getAllDrivers({});
            existingLocalDriver = allDrivers.find(d => d.phone === driver.phone);
            if (existingLocalDriver) {
                console.log(`✅ Found existing driver by phone: ${existingLocalDriver.id}`);
            }
        }
        
        if (!existingLocalDriver) {
            existingLocalDriver = await driverModel.getDriverById(driver_id);
        }

        let updatedDriver;

        if (existingLocalDriver) {
            // ✅ Driver exists locally - UPDATE (without yango_driver_id)
            console.log(`👤 Updating existing local driver: ${existingLocalDriver.id}`);
            updatedDriver = await driverModel.updateDriver(existingLocalDriver.id, {
                first_name: driver.first_name,
                middle_name: driver.middle_name || '',
                last_name: driver.last_name,
                phone: driver.phone,
                email: driver.email || '',
                address: driver.address || '',
                birth_date: driver.birth_date,
                license_country: driver.license_country,
                license_number: driver.license_number,
                license_issue_date: driver.license_issue_date,
                license_expiry_date: driver.license_expiry_date || null,
                driving_experience_since: driver.driving_experience_since || driver.license_issue_date,
                id_document_address: driver.id_document_address || '',
                tax_identification_number: driver.tax_identification_number || '',
                hire_date: driver.hire_date || new Date().toISOString().split('T')[0],
                comment: driver.comment || ''
            });
            console.log(`✅ Driver updated locally with ID: ${updatedDriver.id}`);
        } else {
            // ✅ Driver doesn't exist locally - CREATE
            console.log(`👤 Creating new local driver from Yango data`);
            updatedDriver = await driverModel.createDriver({
                first_name: driver.first_name,
                middle_name: driver.middle_name || '',
                last_name: driver.last_name,
                phone: driver.phone,
                email: driver.email || '',
                address: driver.address || '',
                birth_date: driver.birth_date,
                license_country: driver.license_country,
                license_number: driver.license_number,
                license_issue_date: driver.license_issue_date,
                license_expiry_date: driver.license_expiry_date || null,
                driving_experience_since: driver.driving_experience_since || driver.license_issue_date,
                id_document_address: driver.id_document_address || '',
                tax_identification_number: driver.tax_identification_number || '',
                hire_date: driver.hire_date || new Date().toISOString().split('T')[0],
                comment: driver.comment || '',
                work_rule_id: driver.work_rule_id || null
            });
            console.log(`✅ Driver created locally with ID: ${updatedDriver.id}`);
        }

       // ==========================================
// STEP 2: Update driver in Yango
// ==========================================
try {
    console.log("☁️ Updating driver in Yango...");
    await yangoService.updateDriverInYango(
        driver_id,
        {
            ...driver,
            work_status: 'working'
        }
    );
    console.log('✅ Driver updated in Yango');
    
    // ✅ Save Yango driver ID to local DB
    if (updatedDriver) {
        console.log(`💾 Saving Yango driver ID to local DB: ${driver_id}`);
        const driverWithYango = await driverModel.updateYangoInfo(updatedDriver.id, driver_id);
        updatedDriver = driverWithYango;
        console.log(`✅ Yango driver ID saved: ${updatedDriver.yango_driver_id}`);
        console.log(`✅ Yango sync status: ${updatedDriver.yango_synced}`);
    }
    
} catch (yangoError) {
    console.error('❌ Yango driver update failed:', yangoError.message);
    // Don't fail the whole operation
}
        // ==========================================
        // STEP 3: Handle Car Update
        // ==========================================
        let updatedCar = null;
        let carId = null;

        if (car) {
            // Check if car exists locally by license plate
            const existingCar = await carModel.getCarByLicensePlate(car.license_plate_number);
            
            if (existingCar) {
                console.log(`🚗 Updating existing car locally: ${existingCar.id}`);
                updatedCar = await carModel.updateCar(existingCar.id, car);
                carId = updatedCar.id;
                console.log(`✅ Car updated locally with ID: ${carId}`);
            } else {
                console.log("🚗 Creating new car locally...");
                updatedCar = await carModel.createCar({
                    ...car,
                    yango_synced: true
                });
                carId = updatedCar.id;
                console.log(`✅ New car created locally with ID: ${carId}`);
            }

            // Check if car already has a Yango ID
            if (updatedCar.yango_vehicle_id) {
                // Car already has Yango ID - try to update it
                try {
                    console.log(`☁️ Updating existing car in Yango: ${updatedCar.yango_vehicle_id}`);
                    await yangoService.updateCarInYango(updatedCar.yango_vehicle_id, car);
                    console.log('✅ Car updated in Yango');
                } catch (yangoError) {
                    console.error('❌ Yango car update failed:', yangoError.message);
                    // If update fails, try to create (if car not found)
                    if (yangoError.message.includes('404') || yangoError.message.includes('not found')) {
                        console.log('ℹ️ Car not found in Yango, creating instead...');
                        try {
                            const carSyncResult = await yangoService.createCarInYango(car);
                            if (carSyncResult && carSyncResult.vehicle_id) {
                                await carModel.updateYangoInfo(carId, carSyncResult.vehicle_id);
                                updatedCar = await carModel.getCarById(carId);
                                console.log(`✅ Car created in Yango with ID: ${carSyncResult.vehicle_id}`);
                            }
                        } catch (createError) {
                            console.error('❌ Yango car creation failed:', createError.message);
                        }
                    }
                }
            } else {
                // Try to create car in Yango
                try {
                    console.log("☁️ Creating car in Yango...");
                    const carSyncResult = await yangoService.createCarInYango(car);
                    if (carSyncResult && carSyncResult.vehicle_id) {
                        await carModel.updateYangoInfo(carId, carSyncResult.vehicle_id);
                        updatedCar = await carModel.getCarById(carId);
                        console.log(`✅ Car created in Yango with ID: ${carSyncResult.vehicle_id}`);
                    }
                } catch (yangoError) {
                    console.error('❌ Yango car creation failed:', yangoError.message);
                    
                    // Handle duplicate car error
                    if (yangoError.response?.data?.code === 'car_number_duplicate') {
                        const existingCarId = yangoError.response?.data?.car_id;
                        if (existingCarId) {
                            console.log(`ℹ️ Car already exists in Yango with ID: ${existingCarId}`);
                            await carModel.updateYangoInfo(carId, existingCarId);
                            updatedCar = await carModel.getCarById(carId);
                            console.log('✅ Updated local car with existing Yango ID');
                        }
                    }
                }
            }
        }

     // In registrationController.js - updateRegistration function

// In updateRegistration function - STEP 4: Create or Update Binding

// ==========================================
// STEP 4: Create or Update Binding
// ==========================================
let bindingData = null;
if (carId) {
    console.log("🔗 Creating/updating binding...");
    
    try {
        // ✅ Check if this car already has an active binding
        const existingCarBinding = await client.query(
            `SELECT * FROM car_driver_bindings 
             WHERE car_id = $1 AND is_active = TRUE`,
            [carId]
        );
        
        // ✅ Check if this driver already has an active binding
        const existingDriverBinding = await client.query(
            `SELECT * FROM car_driver_bindings 
             WHERE driver_id = $1 AND is_active = TRUE`,
            [updatedDriver.id]
        );
        
        // ✅ Deactivate existing bindings
        if (existingCarBinding.rows.length > 0) {
            console.log(`🔄 Deactivating existing binding for car: ${existingCarBinding.rows[0].id}`);
            await client.query(
                `UPDATE car_driver_bindings 
                 SET is_active = FALSE
                 WHERE id = $1`,
                [existingCarBinding.rows[0].id]
            );
        }
        
        if (existingDriverBinding.rows.length > 0) {
            const isSameBinding = existingCarBinding.rows.length > 0 && 
                existingDriverBinding.rows[0].id === existingCarBinding.rows[0].id;
            
            if (!isSameBinding) {
                console.log(`🔄 Deactivating existing binding for driver: ${existingDriverBinding.rows[0].id}`);
                await client.query(
                    `UPDATE car_driver_bindings 
                     SET is_active = FALSE
                     WHERE id = $1`,
                    [existingDriverBinding.rows[0].id]
                );
            }
        }
        
        // ✅ Create new binding locally
        const bindingResult = await client.query(
            `INSERT INTO car_driver_bindings (car_id, driver_id, is_active)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [carId, updatedDriver.id, true]
        );
        bindingData = bindingResult.rows[0];
        console.log(`✅ New binding created locally with ID: ${bindingData.id}`);
        
        // ==========================================
        // ✅ SYNC BINDING TO YANGO
        // ==========================================
        // Get the Yango IDs
        const driverYangoId = updatedDriver.yango_driver_id;
        const carYangoId = updatedCar?.yango_vehicle_id;
        
        if (driverYangoId && carYangoId) {
            try {
                console.log(`☁️ Syncing binding to Yango...`);
                console.log(`📤 Car Yango ID: ${carYangoId}`);
                console.log(`📤 Driver Yango ID: ${driverYangoId}`);
                
                await yangoService.bindCarToDriverInYango(carYangoId, driverYangoId);
                
                // ✅ Update binding with Yango sync status
                await client.query(
                    `UPDATE car_driver_bindings 
                     SET yango_synced = TRUE, 
                         yango_sync_error = NULL,
                         yango_last_synced_at = NOW()
                     WHERE id = $1`,
                    [bindingData.id]
                );
                
                console.log(`✅ Binding synced to Yango`);
            } catch (bindingYangoError) {
                console.error('❌ Yango binding sync failed:', bindingYangoError.message);
                // Store the error in the binding record
                await client.query(
                    `UPDATE car_driver_bindings 
                     SET yango_synced = FALSE,
                         yango_sync_error = $1
                     WHERE id = $2`,
                    [bindingYangoError.message, bindingData.id]
                );
                // Don't fail the whole operation
            }
        } else {
            console.warn(`⚠️ Cannot sync binding: Missing Yango IDs`);
            console.warn(`   Driver Yango ID: ${driverYangoId || 'missing'}`);
            console.warn(`   Car Yango ID: ${carYangoId || 'missing'}`);
        }
        
    } catch (bindingError) {
        // ✅ Handle duplicate binding error gracefully
        if (bindingError.code === '23505') {
            console.warn('⚠️ Binding already exists, updating existing binding...');
            const updateResult = await client.query(
                `UPDATE car_driver_bindings 
                 SET is_active = TRUE
                 WHERE car_id = $1 AND driver_id = $2
                 RETURNING *`,
                [carId, updatedDriver.id]
            );
            if (updateResult.rows.length > 0) {
                bindingData = updateResult.rows[0];
                console.log(`✅ Existing binding reactivated with ID: ${bindingData.id}`);
            } else {
                throw bindingError;
            }
        } else {
            throw bindingError;
        }
    }
}

       // ==========================================
// STEP 5: Create or Update Registration
// ==========================================
console.log("📋 Creating/updating registration...");

const existingRegistration = await registrationModel.getRegistrationByDriverId(updatedDriver.id);

let registrationData;
if (existingRegistration) {
    registrationData = await registrationModel.updateRegistration({
        id: existingRegistration.id,
        car_id: carId || existingRegistration.car_id,
        driver_id: updatedDriver.id,
        status: 'completed'
    });
    console.log(`✅ Registration updated with ID: ${registrationData.id}`);
} else {
    registrationData = await registrationModel.createRegistration({
        car_id: carId || null,
        driver_id: updatedDriver.id,
        sales_employee_id: req.employeeId,
        status: 'completed'
    });
    console.log(`✅ Registration created with ID: ${registrationData.id}`);
}

// ✅ UPDATE REGISTRATION YANGO SYNC STATUS
// Since Yango update succeeded, mark registration as synced
try {
    console.log(`💾 Updating registration YANGO sync status to TRUE`);
    const updatedReg = await registrationModel.updateYangoSyncStatus(registrationData.id, true, null);
    registrationData = await registrationModel.getRegistrationById(registrationData.id);
    console.log(`✅ Registration YANGO sync status: ${registrationData.yango_synced}`);
} catch (syncError) {
    console.error('❌ Failed to update registration sync status:', syncError.message);
}
        // ==========================================
        // STEP 6: Commit transaction
        // ==========================================
        await client.query('COMMIT');

        // ==========================================
        // STEP 7: Get complete registration
        // ==========================================
        const completeRegistration = await registrationModel.getRegistrationById(registrationData.id);

        console.log(`🎉 Registration update complete`);
        console.log(`📊 Final driver Yango ID: ${updatedDriver.yango_driver_id}`);
        console.log(`📊 Final driver sync status: ${updatedDriver.yango_synced}`);
        console.log(`📊 Final car Yango ID: ${updatedCar?.yango_vehicle_id || 'N/A'}`);

        return res.status(200).json({
            success: true,
            message: "Registration updated successfully",
            data: {
                registration: completeRegistration,
                driver: updatedDriver,
                car: updatedCar,
                binding: bindingData
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("❌ Update registration error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update registration",
            error: error.message
        });
    } finally {
        client.release();
    }
};
// ✅ Make sure it's exported
module.exports = {
    createFullRegistration,
    getRegistrations,
    getRegistration,
    updateRegistrationStatus,
    deleteRegistration,
    getAllRegistrationsForAdmin,
    checkAvailability,
    updateRegistration  // ← This must be here
};
