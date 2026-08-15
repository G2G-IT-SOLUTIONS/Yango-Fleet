const yangoService = require("../services/yangoService");

// ==========================================
// GET WORK RULES
// ==========================================

const getWorkRules = async (req, res) => {
    try {
        console.log('📊 GET /api/work-rules - Fetching work rules from Yango');
        
        const workRules = await yangoService.getWorkRules();
        
        // Filter only enabled rules (is_enabled = true)
        const enabledRules = workRules?.rules?.filter(rule => rule.is_enabled === true) || [];
        
        console.log(`📊 Found ${enabledRules.length} enabled work rules`);

        res.status(200).json({
            success: true,
            data: enabledRules.map(rule => ({
                id: rule.id,
                name: rule.name,
                is_enabled: rule.is_enabled
            }))
        });
    } catch (error) {
        console.error("❌ Get work rules error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get work rules",
            error: error.message
        });
    }
};

module.exports = {
    getWorkRules
};