// index.js
// Main entry point for the Playwright automation framework

// Configuration
const config = require('./config/config');

// Pages
const LoginPage = require('./pages/LoginPage');
const RegistrationPage = require('./pages/RegistrationPage');
const DashboardPage = require('./pages/DashboardPage');

// Tests
const BaseTest = require('./tests/BaseTest');
const RegistrationTest = require('./tests/ui/RegistrationTest');
const LoginApiTest = require('./tests/api/LoginApiTest');

// Utils
const Utils = require('./utils/helpers/Utils');
const { log, clearLogs, getLogs } = require('./utils/logger/Logger');
const allureReporter = require('./utils/reporter/AllureReporter');
const ApiClient = require('./utils/api/ApiClient');
const DatabaseService = require('./utils/database/DatabaseService');

// Exporting all components for easy access
module.exports = {
    // Configuration
    config,
    
    // Pages
    LoginPage,
    RegistrationPage,
    DashboardPage,
    
    // Tests
    BaseTest,
    RegistrationTest,
    LoginApiTest,
    
    // Utils
    Utils,
    log,
    clearLogs,
    getLogs,
    allureReporter,
    ApiClient,
    DatabaseService,
    
    // Runner function
    runRegistrationTest: async () => {
        const test = new RegistrationTest();
        return await test.run();
    },
    
    runLoginApiTest: async () => {
        const test = new LoginApiTest();
        return await test.run();
    }
};
