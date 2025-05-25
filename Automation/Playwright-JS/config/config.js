// config.js
// Configuration settings for the automation framework

const path = require('path');

const config = {    // Base URL for the application
    baseUrl: 'https://rahulshettyacademy.com/api/ecom',
    clientUrl: 'https://rahulshettyacademy.com/client',
    
    // Output directory for reports and other files
    outputDir: path.join(__dirname, '..', '..', 'output'),
    
    // Excel file for storing credentials
    excelFile: 'newdata.xlsx',
    
    // Allure report directories
    allureResultsDir: path.join(__dirname, '..', '..', 'allure-results'),
    allureReportDir: path.join(__dirname, '..', '..', 'allure-report'),
    
    // Database configuration
    database: {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '12345678',
        database: 'AppDB'
    },
    
    // Browser configuration
    browser: {
        headless: false,  // Set to true for headless mode
        slowMotion: 100,  // Slow down actions by 100ms for visualization
        screenshot: 'only-on-failure'  // 'on', 'off', or 'only-on-failure'
    },
      // Test data configuration
    testData: {
        defaultPassword: 'SecurePass123',
        userEmail: 'anshika@gmail.com',
        userPassword: 'Iamking@000'
    },
    
    // Timeouts
    timeouts: {
        global: 30000,        // Global timeout
        navigation: 30000,    // Navigation timeout
        element: 10000        // Element interaction timeout
    }
};

module.exports = config;
