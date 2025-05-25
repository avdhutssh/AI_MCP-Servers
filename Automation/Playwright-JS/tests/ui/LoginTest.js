// LoginTest.js
// Test for user login functionality

const BaseTest = require('../BaseTest');
const LoginPage = require('../../pages/LoginPage');
const DashboardPage = require('../../pages/DashboardPage');
const ApiClient = require('../../utils/api/ApiClient');
const Utils = require('../../utils/helpers/Utils');
const { log } = require('../../utils/logger/Logger');
const config = require('../../config/config');

/**
 * Login Test
 */
class LoginTest extends BaseTest {
    constructor() {
        super({
            testName: 'Login Test',
            testDescription: 'This test verifies that a user can log in to the application.',
            cleanAllure: false,
            database: false
        });
        
        this.credentials = null;
    }
    
    /**
     * Run the test
     * @returns {Promise<{success: boolean, credentials?: Object, error?: string}>}
     */
    async run() {
        try {
            // Setup
            await this.setup();
            
            // Create page objects
            const loginPage = new LoginPage(this.page);
            const dashboardPage = new DashboardPage(this.page);
            const apiClient = new ApiClient(this.page);
            
            // Step 1: Read credentials from Excel file
            log('Reading credentials from Excel file', 'info');
            
            try {
                const excelData = await Utils.readFromExcel(
                    '${config.outputDir}/${config.excelFile}'
                );
                
                if (excelData.length === 0) {
                    throw new Error('No credentials found in Excel file');
                }
                
                // Use the most recent credentials
                this.credentials = excelData[excelData.length - 1];
                log('Using credentials for: ${this.credentials.email}', 'info');
            } catch (error) {
                log('Error reading Excel data: ${error.message}. Test cannot continue without valid credentials.', 'error');
                await this.teardown(false, error.message);
                return {
                    success: false,
                    error: 'No valid credentials found: ${error.message}'
                };
            }
            
            // Step 2: Navigate to login page
            log('Navigating to login page', 'info');
            await loginPage.navigate(config.baseUrl);
            await this.takeScreenshot('Login Page');
            
            // Step 3: Login with credentials
            log('Logging in with email: ${this.credentials.email}', 'info');
            await loginPage.login(this.credentials.email, this.credentials.password);
            await this.takeScreenshot('After Login');
            
            // Step 4: Verify dashboard is loaded
            const isLoggedIn = await dashboardPage.isLoggedIn();
            
            if (!isLoggedIn) {
                log('Login failed - Dashboard not loaded', 'error');
                await this.teardown(false, 'Login failed - Dashboard not loaded');
                return {
                    success: false,
                    error: 'Login failed - Dashboard not loaded'
                };
            }
            
            log('Login successful - Dashboard loaded', 'success');
            await this.takeScreenshot('Dashboard');
            
            // Step 5: Verify welcome message (optional)
            const welcomeMessage = await dashboardPage.getWelcomeMessage();
            log('Welcome message: ${welcomeMessage}', 'info');
            
            // Complete test
            await this.teardown(true);
            
            return {
                success: true,
                credentials: this.credentials
            };
        } catch (error) {
            log('Test execution error: ${error.message}', 'error');
            await this.teardown(false, error.message);
            
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Run test if executed directly
if (require.main === module) {
    const test = new LoginTest();
    
    test.run()
        .then(result => {
            if (result.success) {
                log('Test completed successfully!', 'success');
                
                // Open Allure report
                test.openReport().catch(() => {
                    log('Could not automatically open report. Run "npm run report" manually.', 'warn');
                });
            } else {
                log('Test completed with errors', 'error');
                if (result.error) {
                    log('Error: ${result.error}', 'error');
                }
            }
        })
        .catch(error => {
            log('Fatal error: ${error.message}', 'error');
            process.exit(1);
        });
}

module.exports = LoginTest;
