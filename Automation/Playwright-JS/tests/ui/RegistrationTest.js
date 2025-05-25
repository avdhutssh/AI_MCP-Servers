// RegistrationTest.js
// Test for user registration and login

const BaseTest = require('../BaseTest');
const LoginPage = require('../../pages/LoginPage');
const RegistrationPage = require('../../pages/RegistrationPage');
const DashboardPage = require('../../pages/DashboardPage');
const ApiClient = require('../../utils/api/ApiClient');
const Utils = require('../../utils/helpers/Utils');
const { log } = require('../../utils/logger/Logger');
const config = require('../../config/config');

/**
 * Registration and Login Test
 */
class RegistrationTest extends BaseTest {
    constructor() {
        super({
            testName: 'Registration and Login Test',
            testDescription: 'This test verifies that a new user can be registered and logged in via the API.',
            database: true,
            cleanAllure: true
        });
        
        this.credentials = {
            email: null,
            password: config.testData.defaultPassword
        };
    }
    
    /**
     * Run the test
     * @returns {Promise<{registrationSuccess: boolean, loginSuccess: boolean, credentials?: Object, error?: string}>}
     */
    async run() {
        try {
            // Setup
            await this.setup();
            
            // Create page objects
            const loginPage = new LoginPage(this.page);
            const registrationPage = new RegistrationPage(this.page);
            const dashboardPage = new DashboardPage(this.page);
            const apiClient = new ApiClient(this.page);
            
            // Step 1: Navigate to login page
            log('Navigating to login page', 'info');
            await loginPage.navigate(config.baseUrl);
            await this.takeScreenshot('Login Page');
            
            // Step 2: Go to registration page
            log('Going to registration page', 'info');
            await loginPage.goToRegistration();
            await this.takeScreenshot('Registration Page');
            
            // Get user data from DB or fallback
            let userData;
            if (this.db) {
                userData = await this.db.fetchRandomRegistrationData();
            } else {
                userData = {
                    firstName: 'Alice',
                    lastName: 'Brown',
                    phoneNumber: '1112223333',
                    occupation: 'Doctor',
                    gender: 'Female',
                    is18OrOlder: true
                };
            }
            
            // Generate unique email
            this.credentials.email = Utils.generateUniqueEmail(userData.firstName, userData.lastName);
            
            // Step 3: Fill registration form with user data
            log('Filling registration form', 'info');
            await registrationPage.fillRegistrationForm({
                ...userData,
                email: this.credentials.email,
                password: this.credentials.password
            });
            await this.takeScreenshot('Filled Registration Form');
            
            // Step 4: Submit registration
            log('Submitting registration', 'info');
            const registrationResult = await registrationPage.submitRegistration();
            await this.takeScreenshot('Registration Result');
            
            // Check registration result
            if (!registrationResult.success) {
                log('Registration failed: ${registrationResult.message}', 'error');
                await this.teardown(false, registrationResult.message);
                return {
                    registrationSuccess: false,
                    loginSuccess: false,
                    error: registrationResult.message
                };
            }
            
            log('Registration successful', 'success');
            
            // Step 5: Perform API login
            log('Attempting API login', 'info');
            const loginResult = await apiClient.login(this.credentials.email, this.credentials.password);
            
            // Check login result
            if (!loginResult.success) {
                log('API Login failed: ${loginResult.message}', 'error');
                await this.teardown(false, loginResult.message);
                return {
                    registrationSuccess: true,
                    loginSuccess: false,
                    credentials: this.credentials,
                    error: loginResult.message
                };
            }
            
            log('API Login successful', 'success');
            
            // Step 6: Save credentials to Excel
            log('Saving credentials to Excel', 'info');
            const excelPath = await Utils.writeToExcel(this.credentials);
            log('Credentials saved to: ${excelPath}', 'success');
            
            // Complete test
            await this.teardown(true);
            await this.generateReport();
            
            return {
                registrationSuccess: true,
                loginSuccess: true,
                credentials: this.credentials
            };
        } catch (error) {
            log('Test execution error: ${error.message}', 'error');
            await this.teardown(false, error.message);
            await this.generateReport();
            
            return {
                registrationSuccess: false,
                loginSuccess: false,
                error: error.message
            };
        }
    }
}

// Run test if executed directly
if (require.main === module) {
    const test = new RegistrationTest();
    
    test.run()
        .then(result => {
            if (result.registrationSuccess && result.loginSuccess) {
                log('Test completed successfully!', 'success');
                log('Email: ${result.credentials.email}', 'info');
                log('Password: ${result.credentials.password}', 'info');
                
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

module.exports = RegistrationTest;
