// testDataProcessor.js
// Utility to process and prepare test data before running tests

const fs = require('fs');
const path = require('path');
const config = require('../../config/config');
const { log } = require('../logger/Logger');
const Utils = require('./Utils');

/**
 * Prepares default test data for all tests
 * @returns {Promise<Object>} - Prepared test data
 */
async function prepareDefaultTestData() {
    const testData = {};
    
    // Prepare user credentials
    try {
        // First try to get from Excel file
        let userCredentials;
        try {
            log('Reading credentials from Excel file', 'info');
            const excelPath = path.join(path.dirname(path.dirname(path.dirname(__dirname))), 'output', 'newdata.xlsx');
            log(`Looking for Excel file at: ${excelPath}`, 'info');
            
            if (fs.existsSync(excelPath)) {
                const excelData = await Utils.readFromExcel(excelPath);
                
                if (excelData && excelData.length > 0) {
                    // Use most recent credentials
                    userCredentials = excelData[excelData.length - 1];
                    log(`Found credentials in Excel for: ${userCredentials.email}`, 'success');
                } else {
                    throw new Error('No credentials found in Excel file');
                }
            } else {
                throw new Error(`Excel file not found at: ${excelPath}`);
            }
        } catch (error) {
            // Fall back to config data
            log(`Excel data unavailable: ${error.message}. Using default credentials.`, 'warn');
            userCredentials = {
                email: config.testData.userEmail,
                password: config.testData.userPassword
            };
        }
          // Store credentials in test data
        testData.userCredentials = userCredentials;
        log(`Prepared user credentials for: ${userCredentials.email}`, 'info');
        
        // Add fallback products data
        testData.products = [
            {
                id: "1",
                name: "Product 1",
                price: 19.99,
                description: "Test product 1 description",
                category: "electronics"
            },
            {
                id: "2",
                name: "Product 2",
                price: 29.99,
                description: "Test product 2 description",
                category: "clothing"
            }
        ];
        
        // Add fallback addresses data
        testData.addresses = [
            {
                street: "123 Main St",
                city: "New York",
                state: "NY",
                zipCode: "10001",
                country: "USA"
            }
        ];
        
    } catch (error) {
        log(`Error preparing default test data: ${error.message}`, 'error');
        
        // Provide emergency fallback data if all else fails
        testData.userCredentials = {
            email: "anshika@gmail.com",
            password: "Iamking@000"
        };
        
        testData.products = [
            {
                id: "1",
                name: "Emergency Product",
                price: 9.99,
                description: "Emergency fallback product",
                category: "other"
            }
        ];
    }
    
    return testData;
}

// Export functionality
module.exports = {
    prepareDefaultTestData
};
