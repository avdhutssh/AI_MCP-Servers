// ApiBaseTest.js
// Base test class for all API tests

const ApiClient = require('../utils/api/ApiClient');
const { log, clearLogs } = require('../utils/logger/Logger');
const allureReporter = require('../utils/reporter/AllureReporter');
const config = require('../config/config');

/**
 * Base test class for API tests
 */
class ApiBaseTest {
    /**
     * Initialize the API test
     * @param {Object} options - Test options
     * @param {boolean} options.cleanAllure - Whether to clean Allure results
     * @param {Object} testData - Test data passed to the test
     */
    constructor(options = {}, testData = {}) {
        // Initialize API client in browserless mode (without page object)
        this.apiClient = new ApiClient(null);
        
        // Store test data
        this.testData = testData;
        
        // Setup test data for Allure reporting
        this.testName = options.testName || 'API Automated Test';
        this.testDescription = options.testDescription || 'API Test executed with Playwright automation framework';
        
        // Clean Allure results if needed
        if (options.cleanAllure) {
            allureReporter.cleanResultsDirectory();
        }
        
        // Clear logs
        clearLogs();
    }
    
    /**
     * Set up the test environment
     */    async setup() {
        log(`Setting up API test: ${this.testName}`, 'info');
    }
    
    /**
     * Tear down the test environment
     * @param {boolean} success - Whether the test was successful
     * @param {string} error - Error message if any
     */
    async teardown(success = true, error = null) {
        log('Tearing down API test environment', 'info');
        
        // Set test result
        if (success) {
            allureReporter.setSuccess();
        } else {
            allureReporter.setFailure(error);
        }
        
        // Write Allure results
        allureReporter.writeResults({
            name: this.testName,
            fullName: this.testName,
            description: this.testDescription
        });
        
        log('API test teardown completed', 'info');
    }
    
    /**
     * Generate Allure report
     */
    async generateReport() {
        return await allureReporter.generateReport();
    }
    
    /**
     * Open Allure report
     */
    async openReport() {
        return await allureReporter.openReport();
    }
}

module.exports = ApiBaseTest;
