const axios = require("axios");

const NHTSA_BASE_URL = "https://vpic.nhtsa.dot.gov/api/vehicles";

// ==========================================
// GET ALL VEHICLE MAKES
// ==========================================

const getAllMakes = async () => {
    try {
        const response = await axios.get(
            `${NHTSA_BASE_URL}/GetAllMakes?format=json`
        );
        return response.data.Results.map(item => ({
            value: item.Make_Name,
            label: item.Make_Name,
            id: item.Make_ID
        }));
    } catch (error) {
        console.error('❌ Error fetching makes:', error.message);
        return [];
    }
};

// ==========================================
// GET MODELS FOR A MAKE
// ==========================================

const getModelsForMake = async (make) => {
    try {
        const response = await axios.get(
            `${NHTSA_BASE_URL}/GetModelsForMake/${encodeURIComponent(make)}?format=json`
        );
        return response.data.Results.map(item => ({
            value: item.Model_Name,
            label: item.Model_Name,
            id: item.Model_ID
        }));
    } catch (error) {
        console.error(`❌ Error fetching models for ${make}:`, error.message);
        return [];
    }
};

// ==========================================
// GET MODELS FOR MAKE AND YEAR
// ==========================================

const getModelsForMakeYear = async (make, year) => {
    try {
        const response = await axios.get(
            `${NHTSA_BASE_URL}/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}?format=json`
        );
        return response.data.Results.map(item => ({
            value: item.Model_Name,
            label: item.Model_Name,
            id: item.Model_ID
        }));
    } catch (error) {
        console.error(`❌ Error fetching models for ${make} ${year}:`, error.message);
        return [];
    }
};

// ==========================================
// GET VEHICLE TYPES FOR A MAKE
// ==========================================

const getVehicleTypesForMake = async (make) => {
    try {
        const response = await axios.get(
            `${NHTSA_BASE_URL}/GetVehicleTypesForMake/${encodeURIComponent(make)}?format=json`
        );
        return response.data.Results.map(item => ({
            value: item.VehicleTypeName,
            label: item.VehicleTypeName
        }));
    } catch (error) {
        console.error(`❌ Error fetching types for ${make}:`, error.message);
        return [];
    }
};

module.exports = {
    getAllMakes,
    getModelsForMake,
    getModelsForMakeYear,
    getVehicleTypesForMake
};