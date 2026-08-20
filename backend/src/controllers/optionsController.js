const yangoService = require("../services/yangoService");
const pool = require("../config/db");

// ==========================================
// GET ALL OPTIONS FOR REGISTRATION FORM
// ==========================================

const getAllOptions = async (req, res) => {
    try {
        console.log('📊 GET /api/options/all - Fetching all options');

        // Fetch ONLY work rules from Yango (dynamic)
        const workRules = await yangoService.getWorkRules();
        
        // Filter only enabled work rules
        const enabledRules = workRules?.rules?.filter(rule => rule.is_enabled === true) || [];

        // All other options are static (from documentation)
        const colors = [
            { value: 'Белый', label: 'White' },
            { value: 'Желтый', label: 'Yellow' },
            { value: 'Бежевый', label: 'Beige' },
            { value: 'Черный', label: 'Black' },
            { value: 'Голубой', label: 'Light Blue' },
            { value: 'Серый', label: 'Gray' },
            { value: 'Красный', label: 'Red' },
            { value: 'Оранжевый', label: 'Orange' },
            { value: 'Синий', label: 'Dark Blue' },
            { value: 'Зеленый', label: 'Green' },
            { value: 'Коричневый', label: 'Brown' },
            { value: 'Фиолетовый', label: 'Purple' },
            { value: 'Розовый', label: 'Pink' }
        ];

        const transmissions = [
            { value: 'mechanical', label: 'Mechanical' },
            { value: 'automatic', label: 'Automatic' },
            { value: 'robotic', label: 'Robotic' },
            { value: 'variator', label: 'Variator' }
        ];

        const statuses = [
            { value: 'unknown', label: 'Unknown' },
            { value: 'working', label: 'Working' },
            { value: 'not_working', label: 'Not Working' },
            { value: 'repairing', label: 'Repairing' },
            { value: 'no_driver', label: 'No Driver' },
            { value: 'pending', label: 'Pending' }
        ];

        const categories = [
            { value: 'econom', label: 'Economy' },
            { value: 'comfort', label: 'Comfort' },
            { value: 'comfort_plus', label: 'Comfort+' },
            { value: 'business', label: 'Business' },
            { value: 'minivan', label: 'Minivan' },
            { value: 'vip', label: 'VIP' },
            { value: 'suv', label: 'SUV' }
        ];

        const licenseCountries = [
            { value: 'eth', label: 'Ethiopia' },
            { value: 'usa', label: 'USA' },
            { value: 'uk', label: 'United Kingdom' },
            { value: 'uae', label: 'UAE' },
            { value: 'ke', label: 'Kenya' },
            { value: 'ng', label: 'Nigeria' },
            { value: 'za', label: 'South Africa' },
            { value: 'eg', label: 'Egypt' },
            { value: 'ma', label: 'Morocco' },
            { value: 'gh', label: 'Ghana' },
            { value: 'tz', label: 'Tanzania' }
        ];

        // Brands and models will be fetched by the frontend directly from NHTSA
        // So we don't need to send them from the backend

        res.status(200).json({
            success: true,
            data: {
                colors: colors,
                transmissions: transmissions,
                statuses: statuses,
                categories: categories,
                licenseCountries: licenseCountries,
                workRules: enabledRules.map(rule => ({
                    id: rule.id,
                    name: rule.name,
                    is_enabled: rule.is_enabled
                }))
            }
        });
    } catch (error) {
        console.error("❌ Get all options error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get options",
            error: error.message
        });
    }
};
// ==========================================
// GET VEHICLE TYPES
// ==========================================

const getVehicleTypes = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                id,
                name,
                image
            FROM vehicle_type
            ORDER BY name ASC
        `);

        res.status(200).json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching vehicle types:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch vehicle types',
            error: error.message
        });
    }
};

module.exports = { getAllOptions,
                   getVehicleTypes
                 };