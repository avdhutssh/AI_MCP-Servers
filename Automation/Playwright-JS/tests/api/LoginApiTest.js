// LoginApiTest.js
// Test for API login functionality

const BaseTest = require('../BaseTest');
const ApiClient = require('../../utils/api/ApiClient');
const Utils = require('../../utils/helpers/Utils');
const { log } = require('../../utils/logger/Logger');
const config = require('../../config/config');

/**
 * API Login Test
 */
class LoginApiTest extends BaseTest {
    constructor() {
        super({
            testName: 'API Login Test',
            testDescription: 'This test verifies that a user can log in via the API.',
            cleanAllure: true
        });
    }
    
    /**
     * Run the test
     * @returns {Promise<{success: boolean, token?: string, userId?: string, error?: string}>}
     */
    async run() {
        try {
            // Setup
            await this.setup();
            
            // Create API client
            const apiClient = new ApiClient(this.page);
            
            // Step 1: Read credentials from Excel file
            log('Reading credentials from Excel file', 'info');
            let credentials;
            
            try {
                const excelData = await Utils.readFromExcel(
                    `${config.outputDir}/${config.excelFile}`
                );
                
                if (excelData.length === 0) {
                    throw new Error('No credentials found in Excel file');
                }
                
                // Use the most recent credentials
                credentials = excelData[excelData.length - 1];
                log(`Using credentials for: ${credentials.email}`, 'info');
            } catch (error) {
                log(`Error reading Excel data: ${error.message}. Using fallback credentials.`, 'warn');
                
                // Use fallback credentials
                credentials = {
                    email: 'alice.brown.20230517T1234.abc@example.com',
                    password: 'SecurePass123'
                };
            }
            
            // Step 2: Perform API login
            log('Attempting API login', 'info');
            const loginResult = await apiClient.login(credentials.email, credentials.password);
            
            // Check login result
            if (!loginResult.success) {
                log(`API Login failed: ${loginResult.message}`, 'error');
                await this.teardown(false, loginResult.message);
                return {
                    success: false,
                    error: loginResult.message
                };
            }
            
            log('API Login successful', 'success');
            
            // Step 3: Get user profile
            log('Getting user profile', 'info');
            const profileResult = await apiClient.getUserProfile(loginResult.token);
            
            if (!profileResult.success) {
                log(`Failed to get user profile: ${profileResult.message}`, 'error');
            } else {
                log(`Profile retrieved for user: ${profileResult.profile.firstName} ${profileResult.profile.lastName}`, 'success');
            }
            
            // Step 4: Get product list
            log('Getting product list', 'info');
            const productsResult = await apiClient.getProductList(loginResult.token);
            
            if (!productsResult.success) {
                log(`Failed to get product list: ${productsResult.message}`, 'error');
            } else {
                log(`Retrieved ${productsResult.products.length} products`, 'success');
            }
            
            // Complete test
            await this.teardown(true);
            await this.generateReport();
            
            return {
                success: true,
                token: loginResult.token,
                userId: loginResult.userId
            };
        } catch (error) {
            log(`Test execution error: ${error.message}`, 'error');
            await this.teardown(false, error.message);
            await this.generateReport();
            
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Run test if executed directly
if (require.main === module) {
    const test = new LoginApiTest();
    
    test.run()
        .then(result => {
            if (result.success) {
                log('Test completed successfully!', 'success');
                log(`User ID: ${result.userId}`, 'info');
                log(`Token: ${result.token.substring(0, 15)}...`, 'info');
                
                // Open Allure report
                test.openReport().catch(() => {
                    log('Could not automatically open report. Run "npm run report" manually.', 'warn');
                });
            } else {
                log('Test completed with errors', 'error');
                if (result.error) {
                    log(`Error: ${result.error}`, 'error');
                }
            }
        })
        .catch(error => {
            log(`Fatal error: ${error.message}`, 'error');
            process.exit(1);
        });
}

module.exports = LoginApiTest;
