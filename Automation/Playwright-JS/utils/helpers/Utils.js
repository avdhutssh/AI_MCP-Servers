// Utils.js
// Utility functions for the automation framework

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ExcelJS = require('exceljs');
const { log } = require('../logger/Logger');
const config = require('../../config/config');

/**
 * Generate a unique email with timestamp and random string
 * @param {string} firstName - First name
 * @param {string} lastName - Last name
 * @returns {string} Unique email address
 */
function generateUniqueEmail(firstName, lastName) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '');
    const randomStr = crypto.randomBytes(3).toString('hex');
    return `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${timestamp}.${randomStr}@example.com`;
}

/**
 * Ensure output directory exists
 */
function ensureOutputDir() {
    if (!fs.existsSync(config.outputDir)) {
        fs.mkdirSync(config.outputDir, { recursive: true });
    }
}

/**
 * Write data to Excel file
 * @param {Object} data - Data to write to Excel
 * @param {string} data.email - Email address
 * @param {string} data.password - Password
 * @returns {Promise<string>} Path to Excel file
 */
async function writeToExcel(data) {
    ensureOutputDir();
    const filePath = path.join(config.outputDir, config.excelFile);
    
    const workbook = new ExcelJS.Workbook();
    let worksheet;
    
    // Check if file exists and create or load accordingly
    if (fs.existsSync(filePath)) {
        await workbook.xlsx.readFile(filePath);
        worksheet = workbook.getWorksheet('Credentials');
    } else {
        worksheet = workbook.addWorksheet('Credentials');
        worksheet.columns = [
            { header: 'Email', key: 'email', width: 50 },
            { header: 'Password', key: 'password', width: 20 },
            { header: 'Timestamp', key: 'timestamp', width: 25 }
        ];
    }
    
    // Add new row with current data
    worksheet.addRow({
        email: data.email,
        password: data.password,
        timestamp: new Date().toISOString()
    });
    
    // Save the workbook
    await workbook.xlsx.writeFile(filePath);
    log(`Data saved to ${filePath}`, 'success');
    return filePath;
}

/**
 * Read data from Excel file
 * @param {string} filePath - Path to Excel file
 * @returns {Promise<Array>} Array of data from Excel
 */
async function readFromExcel(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Excel file not found: ${filePath}`);
    }
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    const worksheet = workbook.getWorksheet('Credentials');
    if (!worksheet) {
        throw new Error('Credentials worksheet not found');
    }
    
    const data = [];
    worksheet.eachRow({ includeEmpty: false, skipHeader: true }, (row, rowNumber) => {
        if (rowNumber > 1) { // Skip header row
            data.push({
                email: row.getCell('email').value,
                password: row.getCell('password').value,
                timestamp: row.getCell('timestamp').value
            });
        }
    });
    
    return data;
}

/**
 * Wait for a specific duration
 * @param {number} ms - Time to wait in milliseconds
 * @returns {Promise<void>}
 */
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate random string
 * @param {number} length - Length of the string
 * @returns {string} Random string
 */
function generateRandomString(length = 8) {
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex')
        .slice(0, length);
}

module.exports = {
    generateUniqueEmail,
    ensureOutputDir,
    writeToExcel,
    readFromExcel,
    wait,
    generateRandomString
};
