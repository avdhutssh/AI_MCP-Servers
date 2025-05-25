// testDataAccess.js
// Test script to verify that test data is correctly passed to test classes

const LoginApiTest = require('./tests/api/LoginApiTest');
const OrderApiTest = require('./tests/api/OrderApiTest');
const AddToCartTest = require('./tests/ui/AddToCartTest');
const { log } = require('./utils/logger/Logger');
const { prepareDefaultTestData } = require('./utils/helpers/TestDataProcessor');

/**
 * Verify test data access
 */
async function verifyTestDataAccess() {
    log('Starting test data access verification', 'info');
    
    try {
        // Prepare test data
        const testData = await prepareDefaultTestData();
        log(`Prepared test data with credentials for: ${testData.userCredentials.email}`, 'info');
        
        // Create test instances with test data
        const loginTest = new LoginApiTest(testData);
        const orderTest = new OrderApiTest(testData);
        const cartTest = new AddToCartTest(testData);
        
        // Verify test data is accessible
        log('Verifying test data access in LoginApiTest', 'info');
        if (loginTest.testData && loginTest.testData.userCredentials) {
            log(`LoginApiTest has access to credentials: ${loginTest.testData.userCredentials.email}`, 'success');
        } else {
            log('LoginApiTest missing test data', 'error');
        }
        
        log('Verifying test data access in OrderApiTest', 'info');
        if (orderTest.testData && orderTest.testData.userCredentials) {
            log(`OrderApiTest has access to credentials: ${orderTest.testData.userCredentials.email}`, 'success');
        } else {
            log('OrderApiTest missing test data', 'error');
        }
        
        log('Verifying test data access in AddToCartTest', 'info');
        if (cartTest.testData && cartTest.testData.userCredentials) {
            log(`AddToCartTest has access to credentials: ${cartTest.testData.userCredentials.email}`, 'success');
        } else {
            log('AddToCartTest missing test data', 'error');
        }
        
        log('Test data access verification completed', 'success');
    } catch (error) {
        log(`Verification failed: ${error.message}`, 'error');
    }
}

// Run the verification
verifyTestDataAccess().catch(error => {
    log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
});
