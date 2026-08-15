const axios = require("axios");
const crypto = require("crypto");
require("dotenv").config();

const YANGO_API_URL = process.env.YANGO_API_URL;

const createYangoHeaders = () => {
    return {
        "X-API-Key": process.env.YANGO_API_KEY,
        "X-Client-ID": process.env.YANGO_CLIENT_ID,
        "X-Park-ID": process.env.YANGO_PARK_ID,
        "Content-Type": "application/json"
    };
};

const getWorkRules = async () => {
    try {
        const url = `${YANGO_API_URL}/v1/parks/driver-work-rules`;
        
        const params = {
            park_id: process.env.YANGO_PARK_ID
        };

        console.log('📋 Fetching work rules from Yango...');
        console.log('🔗 URL:', url);
        console.log('📋 Params:', params);
        console.log('📋 Headers:', {
            ...createYangoHeaders(),
            'X-API-Key': '***HIDDEN***'
        });
        
        const response = await axios.get(
            url,
            {
                headers: createYangoHeaders(),
                params: params
            }
        );

        console.log('✅ Work rules fetched successfully!');
        console.log('\n📋 Available Work Rules:');
        console.log('='.repeat(50));
        
        if (response.data && response.data.rules) {
            response.data.rules.forEach((rule, index) => {
                console.log(`\n${index + 1}. Rule:`);
                console.log(`   ID: ${rule.id}`);
                console.log(`   Name: ${rule.name || 'N/A'}`);
                console.log(`   Enabled: ${rule.is_enabled ? '✅ Yes' : '❌ No'}`);
            });
            
            // Find the first enabled rule
            const enabledRule = response.data.rules.find(r => r.is_enabled === true);
            if (enabledRule) {
                console.log(`\n✅ Recommended Work Rule ID for .env:`);
                console.log(`YANGO_WORK_RULE_ID=${enabledRule.id}`);
            } else if (response.data.rules.length > 0) {
                console.log(`\n✅ First Work Rule ID for .env:`);
                console.log(`YANGO_WORK_RULE_ID=${response.data.rules[0].id}`);
            }
        } else {
            console.log('⚠️ No work rules found in response');
        }
        
        console.log('='.repeat(50));
        
        return response.data;
    } catch (error) {
        console.error('❌ Error fetching work rules:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error(error.message);
        }
        return null;
    }
};

// Run the script
getWorkRules();