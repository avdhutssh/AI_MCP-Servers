// BaseTest.js
// Base test class for all test files

const { chromium } = require('@playwright/test');
const { log, clearLogs } = require('../utils/logger/Logger');
const allureReporter = require('../utils/reporter/AllureReporter');
const DatabaseService = require('../utils/database/DatabaseService');
const config = require('../config/config');

/**
 * Base test class with common setup and teardown methods
 */
class BaseTest {    /**
     * Initialize the test
     * @param {Object} options - Test options
     * @param {boolean} options.database - Whether to connect to database
     * @param {boolean} options.cleanAllure - Whether to clean Allure results
     * @param {Object} testData - Test data passed to the test
     */
    constructor(options = {}, testData = {}) {
        this.browser = null;
        this.page = null;
        this.context = null;
        this.db = options.database ? new DatabaseService(config.database) : null;
        
        // Store test data
        this.testData = testData;
        
        // Setup test data for Allure reporting
        this.testName = options.testName || 'Automated Test';
        this.testDescription = options.testDescription || 'Test executed with Playwright automation framework';
        
        // Clean Allure results if needed
        if (options.cleanAllure) {
            allureReporter.cleanResultsDirectory();
        }
        
        // Clear logs
        clearLogs();
    }
    
    /**
     * Set up the test environment
     * @returns {Promise<void>}
     */    async setup() {
        log(`Setting up test: ${this.testName}`, 'info');
        
        // Launch browser
        this.browser = await chromium.launch({
            headless: config.browser.headless,
            slowMo: config.browser.slowMotion
        });
        
        // Create context and page
        this.context = await this.browser.newContext();
        this.page = await this.context.newPage();
        
        // Set default timeouts
        this.page.setDefaultTimeout(config.timeouts.global);
        this.page.setDefaultNavigationTimeout(config.timeouts.navigation);
        
        // Connect to database if needed
        if (this.db) {
            await this.db.connect().catch(() => {
                log('Will use fallback data due to database connection failure', 'warn');
            });
        }
        
        log('Test setup completed', 'success');
    }
    
    /**
     * Tear down the test environment
     * @param {boolean} success - Whether the test was successful
     * @param {string} error - Error message if any
     * @returns {Promise<void>}
     */
    async teardown(success = true, error = null) {
        log('Tearing down test environment', 'info');
        
        // Set test result
        if (success) {
            allureReporter.setSuccess();
        } else {
            allureReporter.setFailure(error);
        }
        
        // Disconnect from database
        if (this.db) {
            await this.db.disconnect();
        }
        
        // Close browser
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
        
        // Write Allure results
        allureReporter.writeResults({
            name: this.testName,
            fullName: this.testName,
            description: this.testDescription
        });
        
        log('Test teardown completed', 'info');
    }
    
    /**
     * Take a screenshot and attach to Allure report
     * @param {string} name - Screenshot name
     * @returns {Promise<void>}
     */
    async takeScreenshot(name) {
        if (!this.page) {
            log('Cannot take screenshot: page not initialized', 'error');
            return;
        }
        
        const screenshot = await this.page.screenshot();
        allureReporter.createScreenshotAttachment(name, screenshot);
        log(`Screenshot taken: ${name}`, 'info');
    }
    
    /**
     * Generate Allure report
     * @returns {Promise<boolean>}
     */
    async generateReport() {
        return await allureReporter.generateReport();
    }
    
    /**
     * Open Allure report
     * @returns {Promise<boolean>}
     */
    async openReport() {
        return await allureReporter.openReport();
    }
}

module.exports = BaseTest;
