// const axios = require("axios");
// const crypto = require("crypto");

// const YANGO_API_URL = process.env.YANGO_API_URL;

// const createYangoHeaders = () => {
//     return {
//         "X-API-Key": process.env.YANGO_API_KEY,
//         "X-Client-ID": process.env.YANGO_CLIENT_ID,
//         "X-Park-ID": process.env.YANGO_PARK_ID,
//         "X-Idempotency-Token": crypto.randomBytes(16).toString("hex"),
//         "Content-Type": "application/json"
//     };
// };


// // Create car in Yango
// const createCarInYango = async (car) => {

//     const payload = {
//         vehicle_specifications: {
//             model: car.model,
//             brand: car.brand,
//             color: car.color,
//             year: car.year,
//             transmission: car.transmission,
//             vin: car.vin,
//             body_number: car.body_number,
//             mileage: car.mileage
//         },

//         vehicle_licenses: {
//             licence_plate_number: car.license_plate_number,
//             registration_certificate: car.registration_certificate,
//             licence_number: car.taxi_license_number
//         },

//         park_profile: {
//             callsign: car.callsign,
//             status: car.status,
//             is_park_property: car.is_park_property,
//             ownership_type: car.ownership_type,
//             comment: car.comment,
//             fuel_type: car.fuel_type
//         }
//     };

//     const response = await axios.post(
//         `${YANGO_API_URL}/v2/parks/vehicles/car`,
//         payload,
//         {
//             headers: createYangoHeaders()
//         }
//     );

//     return response.data;
// };


// module.exports = {
//     createCarInYango
// };



// // Create driver in Yango

// // Create driver in Yango
// const createDriverInYango = async (driver, carId) => {
//     const formatDate = (date) => {
//         if (!date) return null;
//         const d = new Date(date);
//         return d.toISOString().split('T')[0];
//     };

//     // Try to get work rule ID
//     let workRuleId = process.env.YANGO_WORK_RULE_ID || '';
    
//     // If work_rule_id is not set in env, try to fetch it from Yango
//     if (!workRuleId || workRuleId.trim().length === 0) {
//         console.log('🔍 Work rule ID not found in env, fetching from Yango...');
//         workRuleId = await getWorkRuleIdByName('Default');
        
//         if (workRuleId) {
//             console.log(`✅ Using work rule ID: ${workRuleId}`);
//         } else {
//             console.log('⚠️ No work rule ID available, proceeding without it');
//         }
//     }

//     // Build account object
//     const account = {
//         balance_limit: '0',
//         block_orders_on_balance_below_limit: false
//     };
    
//     // Only add work_rule_id if it exists and is not empty
//     if (workRuleId && workRuleId.trim().length > 0) {
//         account.work_rule_id = workRuleId.trim();
//     }
    
//     // Only add payment_service_id if it exists
//     const paymentServiceId = process.env.YANGO_PAYMENT_SERVICE_ID || '';
//     if (paymentServiceId && paymentServiceId.trim().length > 0) {
//         account.payment_service_id = paymentServiceId.trim();
//     }

//     const payload = {
//         person: {
//             full_name: {
//                 first_name: driver.first_name,
//                 middle_name: driver.middle_name || '',
//                 last_name: driver.last_name
//             },
//             contact_info: {
//                 phone: driver.phone || '',
//                 address: driver.address || '',
//                 email: driver.email || ''
//             },
//             driver_license: {
//                 country: driver.license_country || 'eth',
//                 number: driver.license_number || '',
//                 issue_date: formatDate(driver.license_issue_date),
//                 expiry_date: formatDate(driver.license_expiry_date),
//                 birth_date: formatDate(driver.birth_date)
//             },
//             driver_license_experience: {
//                 total_since_date: formatDate(driver.driving_experience_since)
//             },
//             id_doc: {
//                 address: driver.id_document_address || ''
//             },
//             tax_identification_number: driver.tax_identification_number || ''
//         },
//         profile: {
//             hire_date: formatDate(driver.hire_date),
//             comment: driver.comment || ''
//         },
//         account: account,
//         car_id: carId,
//         order_provider: {
//             platform: true,
//             partner: true
//         }
//     };

//     console.log('📤 Driver payload being sent to Yango:', JSON.stringify(payload, null, 2));

//     try {
//         const response = await axios.post(
//             `${YANGO_API_URL}/v2/parks/contractors/driver-profile`,
//             payload,
//             { headers: createYangoHeaders() }
//         );
//         console.log('✅ Driver created successfully in Yango');
//         return response.data;
//     } catch (error) {
//         console.error('❌ Yango Driver API Error:', error.response?.data || error.message);
//         throw error;
//     }
// };


// // ==========================================
// // BIND CAR TO DRIVER IN YANGO
// // ==========================================

// const bindCarToDriverInYango = async (carYangoId, driverYangoId) => {
//     // Using query parameters as specified in the API
//     const url = `${YANGO_API_URL}/v1/parks/driver-profiles/car-bindings`;
    
//     const params = {
//         car_id: carYangoId,
//         driver_profile_id: driverYangoId,
//         park_id: process.env.YANGO_PARK_ID
//     };

//     const response = await axios.put(
//         url,
//         null, // No body, using query parameters
//         {
//             headers: createYangoHeaders(),
//             params: params
//         }
//     );

//     return response.data;
// };

// // ==========================================
// // UNBIND CAR FROM DRIVER IN YANGO
// // ==========================================

// const unbindCarFromDriverInYango = async (carYangoId, driverYangoId) => {
//     const url = `${YANGO_API_URL}/v1/parks/driver-profiles/car-bindings`;
    
//     const params = {
//         car_id: carYangoId,
//         driver_profile_id: driverYangoId,
//         park_id: process.env.YANGO_PARK_ID
//     };

//     const response = await axios.delete(
//         url,
//         {
//             headers: createYangoHeaders(),
//             params: params
//         }
//     );

//     return response.data;
// };
// // ==========================================
// // GET WORK RULES
// // ==========================================

// const getWorkRules = async () => {
//     try {
//         const url = `${YANGO_API_URL}/v1/parks/driver-work-rules`;
        
//         const params = {
//             park_id: process.env.YANGO_PARK_ID
//         };

//         console.log('📋 Fetching work rules from Yango...');
        
//         const response = await axios.get(
//             url,
//             {
//                 headers: createYangoHeaders(),
//                 params: params
//             }
//         );

//         console.log('✅ Work rules fetched successfully');
        
//         return response.data;
//     } catch (error) {
//         console.error('❌ Error fetching work rules:', error.response?.data || error.message);
//         throw error;
//     }
// };

// // Create car in Yango
// const createCarInYango = async (car) => {
//     // ... existing code
// };

// // Create driver in Yango
// const createDriverInYango = async (driver, carId) => {
//     const formatDate = (date) => {
//         if (!date) return null;
//         const d = new Date(date);
//         return d.toISOString().split('T')[0];
//     };

//     const payload = {
//         person: {
//             full_name: {
//                 first_name: driver.first_name,
//                 middle_name: driver.middle_name || '',
//                 last_name: driver.last_name
//             },
//             contact_info: {
//                 phone: driver.phone || '',
//                 address: driver.address || '',
//                 email: driver.email || ''
//             },
//             driver_license: {
//                 country: driver.license_country || 'eth',
//                 number: driver.license_number || '',
//                 issue_date: formatDate(driver.license_issue_date),
//                 expiry_date: formatDate(driver.license_expiry_date),
//                 birth_date: formatDate(driver.birth_date)
//             },
//             driver_license_experience: {
//                 total_since_date: formatDate(driver.driving_experience_since)
//             },
//             id_doc: {
//                 address: driver.id_document_address || ''
//             },
//             tax_identification_number: driver.tax_identification_number || ''
//         },
//         profile: {
//             hire_date: formatDate(driver.hire_date),
//             comment: driver.comment || ''
//         },
//         account: {
//             work_rule_id: driver.work_rule_id || '',
//             balance_limit: '0',
//             block_orders_on_balance_below_limit: false
//         },
//         car_id: carId,
//         order_provider: {
//             platform: true,
//             partner: true
//         }
//     };

//     console.log('📤 Driver payload being sent to Yango:', JSON.stringify(payload, null, 2));

//     try {
//         const response = await axios.post(
//             `${YANGO_API_URL}/v2/parks/contractors/driver-profile`,
//             payload,
//             { headers: createYangoHeaders() }
//         );
//         console.log('✅ Driver created successfully in Yango');
//         return response.data;
//     } catch (error) {
//         console.error('❌ Yango Driver API Error:', error.response?.data || error.message);
//         throw error;
//     }
// };

// // ==========================================
// // GET WORK RULE ID BY NAME
// // ==========================================

// const getWorkRuleIdByName = async (ruleName = 'Default') => {
//     try {
//         const workRules = await getWorkRules();
        
//         if (!workRules || !workRules.rules) {
//             console.log('⚠️ No work rules found');
//             return null;
//         }

//         // Find rule by name (case insensitive)
//         const rule = workRules.rules.find(r => 
//             r.name && r.name.toLowerCase() === ruleName.toLowerCase()
//         );

//         if (rule) {
//             console.log(`✅ Found work rule "${rule.name}" with ID: ${rule.id}`);
//             return rule.id;
//         }

//         // If no rule found by name, return the first enabled rule
//         const enabledRule = workRules.rules.find(r => r.is_enabled === true);
//         if (enabledRule) {
//             console.log(`✅ Using first enabled work rule: "${enabledRule.name}" with ID: ${enabledRule.id}`);
//             return enabledRule.id;
//         }

//         // If no enabled rule, return the first rule
//         if (workRules.rules.length > 0) {
//             console.log(`✅ Using first work rule: "${workRules.rules[0].name}" with ID: ${workRules.rules[0].id}`);
//             return workRules.rules[0].id;
//         }

//         console.log('⚠️ No work rules available');
//         return null;
//     } catch (error) {
//         console.error('❌ Error getting work rule ID:', error.message);
//         return null;
//     }
// };

// module.exports = {
//     createCarInYango,
//     createDriverInYango,
//     bindCarToDriverInYango,
//     unbindCarFromDriverInYango,
//     getWorkRules,
//     getWorkRuleIdByName

// };



const axios = require("axios");
const crypto = require("crypto");

const YANGO_API_URL = process.env.YANGO_API_URL;

// ==========================================
// HEADERS
// ==========================================

const createYangoHeaders = () => {
    return {
        "X-API-Key": process.env.YANGO_API_KEY,
        "X-Client-ID": process.env.YANGO_CLIENT_ID,
        "X-Park-ID": process.env.YANGO_PARK_ID,
        "X-Idempotency-Token": crypto.randomBytes(16).toString("hex"),
        "Content-Type": "application/json"
    };
};

// ==========================================
// COLOR MAPPING
// ==========================================

const colorMap = {
    'white': 'Белый',
    'yellow': 'Желтый',
    'beige': 'Бежевый',
    'black': 'Черный',
    'light blue': 'Голубой',
    'gray': 'Серый',
    'grey': 'Серый',
    'red': 'Красный',
    'orange': 'Оранжевый',
    'dark blue': 'Синий',
    'blue': 'Синий',
    'green': 'Зеленый',
    'brown': 'Коричневый',
    'purple': 'Фиолетовый',
    'pink': 'Розовый',
    'silver': 'Серый'
};

const getYangoColor = (color) => {
    if (!color) return 'Белый';
    const lowerColor = color.toLowerCase().trim();
    return colorMap[lowerColor] || color;
};

// ==========================================
// CREATE CAR IN YANGO
// ==========================================

const createCarInYango = async (car) => {
    const mappedColor = getYangoColor(car.color);

    const payload = {
        vehicle_specifications: {
            model: car.model,
            brand: car.brand,
            color: mappedColor,
            year: parseInt(car.year) || 2020,
            transmission: car.transmission || 'Unknown',
            vin: car.vin || '',
            body_number: car.body_number || '',
            mileage: parseInt(car.mileage) || 0
        },
        vehicle_licenses: {
            licence_plate_number: car.license_plate_number || '',
            registration_certificate: car.registration_certificate || '',
            licence_number: car.taxi_license_number || ''
        },
        park_profile: {
            callsign: car.callsign || '',
            status: car.status || 'Active',
            is_park_property: car.is_park_property || false,
            ownership_type: car.ownership_type || 'park',
            comment: car.comment || '',
            fuel_type: car.fuel_type || 'petrol'
        }
    };

    console.log('📤 Sending car to Yango:', JSON.stringify(payload, null, 2));

    try {
        const response = await axios.post(
            `${YANGO_API_URL}/v2/parks/vehicles/car`,
            payload,
            { headers: createYangoHeaders() }
        );
        console.log('✅ Car created successfully in Yango');
        return response.data;
    } catch (error) {
        console.error('❌ Yango Car API Error:', error.response?.data || error.message);
        throw error;
    }
};

// ==========================================
// CREATE DRIVER IN YANGO
// ==========================================

// const createDriverInYango = async (driver, carId) => {
//     const formatDate = (date) => {
//         if (!date) return null;
//         const d = new Date(date);
//         return d.toISOString().split('T')[0];
//     };

//     // Build account object
//     const account = {
//         balance_limit: '0',
//         block_orders_on_balance_below_limit: false
//     };

//     // Only add work_rule_id if it exists and is not empty
//     if (driver.work_rule_id && driver.work_rule_id.trim().length > 0) {
//         account.work_rule_id = driver.work_rule_id.trim();
//     }

//     // Only add payment_service_id if it exists
//     const paymentServiceId = process.env.YANGO_PAYMENT_SERVICE_ID || '';
//     if (paymentServiceId && paymentServiceId.trim().length > 0) {
//         account.payment_service_id = paymentServiceId.trim();
//     }

//     const payload = {
//         person: {
//             full_name: {
//                 first_name: driver.first_name,
//                 middle_name: driver.middle_name || '',
//                 last_name: driver.last_name
//             },
//             contact_info: {
//                 phone: driver.phone || '',
//                 address: driver.address || '',
//                 email: driver.email || ''
//             },
//             driver_license: {
//                 country: driver.license_country || 'eth',
//                 number: driver.license_number || '',
//                 issue_date: formatDate(driver.license_issue_date),
//                 expiry_date: formatDate(driver.license_expiry_date),
//                 birth_date: formatDate(driver.birth_date)
//             },
//             driver_license_experience: {
//                 total_since_date: formatDate(driver.driving_experience_since)
//             },
//             id_doc: {
//                 address: driver.id_document_address || ''
//             },
//             tax_identification_number: driver.tax_identification_number || ''
//         },
//         profile: {
//             hire_date: formatDate(driver.hire_date),
//             comment: driver.comment || ''
//         },
//         account: account,
//         car_id: carId,
//         order_provider: {
//             platform: true,
//             partner: true
//         }
//     };

//     console.log('📤 Sending driver to Yango:', JSON.stringify(payload, null, 2));

//     try {
//         const response = await axios.post(
//             `${YANGO_API_URL}/v2/parks/contractors/driver-profile`,
//             payload,
//             { headers: createYangoHeaders() }
//         );
//         console.log('✅ Driver created successfully in Yango');
//         return response.data;
//     } catch (error) {
//         console.error('❌ Yango Driver API Error:', error.response?.data || error.message);
//         throw error;
//     }
// };

// ==========================================
// CREATE DRIVER IN YANGO
// ==========================================

const createDriverInYango = async (driver, carId) => {
    const formatDate = (date) => {
        if (!date) return null;
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    };

    // Get work_rule_id from driver data (passed from frontend) or env
    // We don't save it locally, just use it for the Yango API call
    const workRuleId = driver.work_rule_id || process.env.YANGO_WORK_RULE_ID || '';

    // If no work_rule_id provided, use a default from your Yango park
    const finalWorkRuleId = workRuleId || '1f8be11e85064ae29dbcc47070c2a9e8';

    console.log(`✅ Using work_rule_id for Yango: ${finalWorkRuleId}`);

    const account = {
        balance_limit: '0',
        block_orders_on_balance_below_limit: false,
        work_rule_id: finalWorkRuleId  // ← Used only for Yango API
    };

    const payload = {
        person: {
            full_name: {
                first_name: driver.first_name,
                middle_name: driver.middle_name || '',
                last_name: driver.last_name
            },
            contact_info: {
                phone: driver.phone || '',
                address: driver.address || '',
                email: driver.email || ''
            },
            driver_license: {
                country: driver.license_country || 'eth',
                number: driver.license_number || '',
                issue_date: formatDate(driver.license_issue_date),
                expiry_date: formatDate(driver.license_expiry_date),
                birth_date: formatDate(driver.birth_date)
            },
            driver_license_experience: {
                total_since_date: formatDate(driver.driving_experience_since)
            },
            id_doc: {
                address: driver.id_document_address || ''
            },
            tax_identification_number: driver.tax_identification_number || ''
        },
        profile: {
            hire_date: formatDate(driver.hire_date),
            comment: driver.comment || ''
        },
        account: account,  // ← Contains work_rule_id for Yango
        car_id: carId,
        order_provider: {
            platform: true,
            partner: true
        }
    };

    console.log('📤 Sending driver to Yango:', JSON.stringify(payload, null, 2));

    try {
        const response = await axios.post(
            `${YANGO_API_URL}/v2/parks/contractors/driver-profile`,
            payload,
            { headers: createYangoHeaders() }
        );
        console.log('✅ Driver created successfully in Yango');
        return response.data;
    } catch (error) {
        console.error('❌ Yango Driver API Error:', error.response?.data || error.message);
        throw error;
    }
};

// ==========================================
// BIND CAR TO DRIVER IN YANGO
// ==========================================

const bindCarToDriverInYango = async (carYangoId, driverYangoId) => {
    const url = `${YANGO_API_URL}/v1/parks/driver-profiles/car-bindings`;
    
    const params = {
        car_id: carYangoId,
        driver_profile_id: driverYangoId,
        park_id: process.env.YANGO_PARK_ID
    };

    console.log(`🔗 Binding car ${carYangoId} to driver ${driverYangoId}`);

    try {
        const response = await axios.put(
            url,
            null,
            {
                headers: createYangoHeaders(),
                params: params
            }
        );
        console.log('✅ Binding created successfully in Yango');
        return response.data;
    } catch (error) {
        console.error('❌ Yango Binding API Error:', error.response?.data || error.message);
        throw error;
    }
};

// ==========================================
// UNBIND CAR FROM DRIVER IN YANGO
// ==========================================

const unbindCarFromDriverInYango = async (carYangoId, driverYangoId) => {
    const url = `${YANGO_API_URL}/v1/parks/driver-profiles/car-bindings`;
    
    const params = {
        car_id: carYangoId,
        driver_profile_id: driverYangoId,
        park_id: process.env.YANGO_PARK_ID
    };

    console.log(`🔓 Unbinding car ${carYangoId} from driver ${driverYangoId}`);

    try {
        const response = await axios.delete(
            url,
            {
                headers: createYangoHeaders(),
                params: params
            }
        );
        console.log('✅ Binding removed successfully in Yango');
        return response.data;
    } catch (error) {
        console.error('❌ Yango Unbind API Error:', error.response?.data || error.message);
        throw error;
    }
};

// ==========================================
// GET WORK RULES FROM YANGO
// ==========================================

const getWorkRules = async () => {
    try {
        const url = `${YANGO_API_URL}/v1/parks/driver-work-rules`;
        
        const params = {
            park_id: process.env.YANGO_PARK_ID
        };

        console.log('📋 Fetching work rules from Yango...');
        
        const response = await axios.get(
            url,
            {
                headers: createYangoHeaders(),
                params: params
            }
        );

        console.log('✅ Work rules fetched successfully');
        
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching work rules:', error.response?.data || error.message);
        throw error;
    }
};

// ==========================================
// GET WORK RULE ID BY NAME
// ==========================================

const getWorkRuleIdByName = async (ruleName = 'Default') => {
    try {
        const workRules = await getWorkRules();
        
        if (!workRules || !workRules.rules) {
            console.log('⚠️ No work rules found');
            return null;
        }

        // Find rule by name (case insensitive)
        const rule = workRules.rules.find(r => 
            r.name && r.name.toLowerCase() === ruleName.toLowerCase()
        );

        if (rule) {
            console.log(`✅ Found work rule "${rule.name}" with ID: ${rule.id}`);
            return rule.id;
        }

        // If no rule found by name, return the first enabled rule
        const enabledRule = workRules.rules.find(r => r.is_enabled === true);
        if (enabledRule) {
            console.log(`✅ Using first enabled work rule: "${enabledRule.name}" with ID: ${enabledRule.id}`);
            return enabledRule.id;
        }

        // If no enabled rule, return the first rule
        if (workRules.rules.length > 0) {
            console.log(`✅ Using first work rule: "${workRules.rules[0].name}" with ID: ${workRules.rules[0].id}`);
            return workRules.rules[0].id;
        }

        console.log('⚠️ No work rules available');
        return null;
    } catch (error) {
        console.error('❌ Error getting work rule ID:', error.message);
        return null;
    }
};

// ==========================================
// GET COLOR ENUM (from Yango API documentation)
// ==========================================

const getColorEnum = async () => {
    // Colors are defined in Yango API documentation
    return {
        colors: [
            { value: 'Белый', label: 'White (Белый)' },
            { value: 'Желтый', label: 'Yellow (Желтый)' },
            { value: 'Бежевый', label: 'Beige (Бежевый)' },
            { value: 'Черный', label: 'Black (Черный)' },
            { value: 'Голубой', label: 'Light Blue (Голубой)' },
            { value: 'Серый', label: 'Gray (Серый)' },
            { value: 'Красный', label: 'Red (Красный)' },
            { value: 'Оранжевый', label: 'Orange (Оранжевый)' },
            { value: 'Синий', label: 'Dark Blue (Синий)' },
            { value: 'Зеленый', label: 'Green (Зеленый)' },
            { value: 'Коричневый', label: 'Brown (Коричневый)' },
            { value: 'Фиолетовый', label: 'Purple (Фиолетовый)' },
            { value: 'Розовый', label: 'Pink (Розовый)' }
        ]
    };
};

// ==========================================
// GET TRANSMISSION ENUM
// ==========================================

const getTransmissionEnum = async () => {
    return {
        transmissions: [
            { value: 'mechanical', label: 'Mechanical' },
            { value: 'automatic', label: 'Automatic' },
            { value: 'robotic', label: 'Robotic' },
            { value: 'variator', label: 'Variator' }
        ]
    };
};

// ==========================================
// GET VEHICLE STATUS ENUM
// ==========================================

const getVehicleStatusEnum = async () => {
    return {
        statuses: [
            { value: 'unknown', label: 'Unknown' },
            { value: 'working', label: 'Working' },
            { value: 'not_working', label: 'Not Working' },
            { value: 'repairing', label: 'Repairing' },
            { value: 'no_driver', label: 'No Driver' },
            { value: 'pending', label: 'Pending' }
        ]
    };
};

// ==========================================
// GET VEHICLES FROM YANGO
// ==========================================

const getVehiclesFromYango = async () => {
    try {
        const url = `${YANGO_API_URL}/v2/parks/vehicles/list`;
        
        const params = {
            park_id: process.env.YANGO_PARK_ID,
            limit: 100
        };

        console.log('🚗 Fetching vehicles from Yango...');
        
        const response = await axios.post(
            url,
            payload,
            {
                headers: createYangoHeaders()
            }
        );

        console.log(`✅ Vehicles fetched successfully: ${response.data?.vehicles?.length || 0} vehicles`);
        
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching vehicles:', error.response?.data || error.message);
        return { vehicles: [] };
    }
};

// ==========================================
// GET LICENSE COUNTRY ENUM
// ==========================================

const getLicenseCountryEnum = async () => {
    return {
        countries: [
            { value: 'eth', label: 'Ethiopia (ETH)' },
            { value: 'usa', label: 'USA (USA)' },
            { value: 'uk', label: 'United Kingdom (UK)' },
            { value: 'uae', label: 'UAE (UAE)' },
            { value: 'ke', label: 'Kenya (KE)' },
            { value: 'ng', label: 'Nigeria (NG)' },
            { value: 'za', label: 'South Africa (ZA)' },
            { value: 'eg', label: 'Egypt (EG)' },
            { value: 'ma', label: 'Morocco (MA)' },
            { value: 'gh', label: 'Ghana (GH)' },
            { value: 'tz', label: 'Tanzania (TZ)' }
        ]
    };
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
    createCarInYango,
    createDriverInYango,
    bindCarToDriverInYango,
    unbindCarFromDriverInYango,
    getWorkRules,
    getWorkRuleIdByName,
    getColorEnum,
    getTransmissionEnum,
    getVehicleStatusEnum,
    getLicenseCountryEnum,
    getYangoColor,
    getVehiclesFromYango
};