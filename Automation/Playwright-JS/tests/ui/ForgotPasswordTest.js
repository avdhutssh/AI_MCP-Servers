// ForgotPasswordTest.js
// Test for forgot password functionality

const BaseTest = require('../BaseTest');
const LoginPage = require('../../pages/LoginPage');
const ApiClient = require('../../utils/api/ApiClient');
const Utils = require('../../utils/helpers/Utils');
const { log } = require('../../utils/logger/Logger');
const config = require('../../config/config');

/**
 * Forgot Password Test
 */
class ForgotPasswordTest extends BaseTest {
    constructor() {
        super({
            testName: 'Forgot Password Test',
            testDescription: 'This test verifies that a user can reset their password via forgot password functionality.',
            database: true,
            cleanAllure: true
        });
    }
    
    /**
     * Run the test
     * @returns {Promise<{success: boolean, message?: string, error?: string}>}
     */
    async run() {
        try {
            // Setup
            await this.setup();
            
            // Create page objects
            const loginPage = new LoginPage(this.page);
            const apiClient = new ApiClient(this.page);
            
            // Step 1: Navigate to login page
            log('Navigating to login page', 'info');
            await loginPage.navigate(config.baseUrl);
            await this.takeScreenshot('Login Page');
            
            // Step 2: Get a valid user email from database or use a default one
            let userEmail;
            if (this.db) {
                const userData = await this.db.fetchRandomUser();
                userEmail = userData?.email;
            }
            
            // If no user found in DB, use a default one
            if (!userEmail) {
                const excelData = await Utils.readFromExcel();
                userEmail = excelData?.email || 'test@example.com';
            }
            
            log('Using email for password reset: ${userEmail}', 'info');
            
            // Step 3: Click on forgot password link
            log('Clicking on forgot password link', 'info');
            await loginPage.goToForgotPassword();
            await this.takeScreenshot('Forgot Password Page');
            
            // Step 4: Enter email and submit
            log('Entering email for password reset', 'info');
            await this.page.locator('#userEmail').fill(userEmail);
            await this.takeScreenshot('Email Entered');
            
            // Step 5: Submit forgot password form
            log('Submitting forgot password form', 'info');
            await this.page.locator('button:text("Reset")').click();
            
            // Step 6: Wait for success message
            log('Waiting for success message', 'info');
            const successMessage = await this.page.locator('.message-box')
                .textContent({ timeout: config.timeouts.short });
            
            await this.takeScreenshot('Password Reset Result');
            
            // Step a reset email is sent
            if (successMessage.includes('reset link') || successMessage.includes('email sent')) {
                log('Password reset email sent successfully', 'success');
                
                // Step 7: Verify via API that reset was initiated
                log('Verifying password reset via API', 'info');
                const verifyResult = await apiClient.verifyPasswordResetRequest(userEmail);
                
                if (verifyResult.success) {
                    log('Password reset request verified via API', 'success');
                    await this.teardown(true);
                    await this.generateReport();
                    
                    return {
                        success: true,
                        message: 'Password reset request completed successfully'
                    };
                } else {
                    log('API verification failed: ${verifyResult.message}', 'error');
                    await this.teardown(false, verifyResult.message);
                    await this.generateReport();
                    
                    return {
                        success: false,
                        error: verifyResult.message
                    };
                }
            } else {
                const errorMessage = 'Password reset email not sent. Error in password reset flow.';
                log(errorMessage, 'error');
                await this.teardown(false, errorMessage);
                await this.generateReport();
                
                return {
                    success: false,
                    error: errorMessage
                };
            }
        } catch (error) {
            log('Test execution error: ${error.message}', 'error');
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
    const test = new ForgotPasswordTest();
    
    test.run()
        .then(result => {
            if (result.success) {
                log('Test completed successfully!', 'success');
                log(result.message, 'info');
                
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

module.exports = ForgotPasswordTest;
