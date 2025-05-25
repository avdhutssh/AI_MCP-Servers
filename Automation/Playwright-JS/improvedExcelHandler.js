// improvedExcelHandler.js
// Script to create improved Excel handling functions

const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const { log } = require('./utils/logger/Logger');
const config = require('./config/config');

/**
 * Creates default test data with or without Excel file
 * @returns {Object} Default test data
 */
async function createDefaultTestData() {
    const testData = {
        userCredentials: {
            email: config.testData.userEmail || 'anshika@gmail.com',
            password: config.testData.userPassword || 'Iamking@000'
        },
        products: [
            {
                id: "1",
                name: "zara coat 3", 
                price: 31500,
                description: "Test product description",
                category: "fashion"
            }
        ]
    };
    
    // Try to read from Excel if it exists
    try {
        const excelPath = path.join(__dirname, 'output', 'newdata.xlsx');
        log(`Checking for Excel file at: ${excelPath}`, 'info');
        
        if (fs.existsSync(excelPath)) {
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(excelPath);
            
            const worksheet = workbook.getWorksheet('Credentials');
            if (worksheet) {
                const data = [];
                worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                    if (rowNumber > 1) { // Skip header row
                        const email = row.getCell(1).value;
                        const password = row.getCell(2).value;
                        
                        if (email && password) {
                            data.push({ email, password });
                        }
                    }
                });
                
                if (data.length > 0) {
                    // Use the most recent credentials
                    testData.userCredentials = data[data.length - 1];
                    log(`Found credentials in Excel for: ${testData.userCredentials.email}`, 'success');
                }
            }
        } else {
            log(`Excel file not found at: ${excelPath}`, 'warn');
        }
    } catch (error) {
        log(`Error reading Excel: ${error.message}`, 'error');
        // Continue with default data
    }
    
    return testData;
}

// Execute once to check it works
createDefaultTestData()
    .then(data => {
        log('Default test data created:', 'info');
        log(`User: ${data.userCredentials.email}`, 'info');
        log(`Products: ${data.products.length}`, 'info');
    })
    .catch(error => {
        log(`Error: ${error.message}`, 'error');
    });

module.exports = { createDefaultTestData };
