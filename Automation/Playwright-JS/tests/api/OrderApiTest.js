// OrderApiTest.js
// API test for order operations

const ApiBaseTest = require('../ApiBaseTest');
const { log } = require('../../utils/logger/Logger');
const allureReporter = require('../../utils/reporter/AllureReporter');
const config = require('../../config/config');

/**
 * Order API Test
 */
class OrderApiTest extends ApiBaseTest {
    /**
     * @param {Object} testData - Test data passed from test runner
     */
    constructor(testData = {}) {
        super({
            testName: 'Order API Test',
            testDescription: 'This test verifies order API operations including creating and retrieving orders.',
            cleanAllure: true
        }, testData);
        
        // Use credentials from test data if available, otherwise use defaults
        this.credentials = testData && testData.userCredentials ? testData.userCredentials : {
            email: config.testData.userEmail || 'anshika@gmail.com',
            password: config.testData.userPassword || 'Iamking@000'
        };
        
        this.token = null;
    }
    
    /**
     * Run the test
     * @returns {Promise<{success: boolean, message?: string, error?: string}>}
     */
    async run() {
        try {
            // Setup
            await this.setup();
            
            // Step 1: Login to get token
            log('Logging in to get authentication token', 'info');
            const loginResult = await this.apiClient.login(this.credentials.email, this.credentials.password);
            
            if (!loginResult.success) {
                log(`Login failed: ${loginResult.message}`, 'error');
                await this.teardown(false, loginResult.message);
                return {
                    success: false,
                    error: loginResult.message
                };
            }
            
            this.token = loginResult.token;
            log('Login successful, token obtained', 'success');
            
            // Step 2: Get products to create an order
            log('Getting products for order', 'info');
            const productsResult = await this.apiClient.getProducts();
            
            if (!productsResult.success || !productsResult.data.length) {
                const errorMessage = productsResult.message || 'No products found';
                log('Failed to get products: ${errorMessage}', 'error');
                await this.teardown(false, errorMessage);
                return {
                    success: false,
                    error: errorMessage
                };
            }
            
            // Select one product for the order
            const product = productsResult.data[0];
            log('Selected product for order: ${product.productName}', 'info');
            allureReporter.createJsonAttachment('Selected Product', product);
            
            // Step 3: Create order data
            const orderData = {
                productId: product._id,
                productName: product.productName,
                productImage: product.productImage,
                productPrice: product.price,
                quantity: 1,
                deliveryAddress: {
                    street: '123 Test Street',
                    city: 'Test City',
                    state: 'Test State',
                    country: 'United States',
                    zipCode: '12345'
                },
                paymentMethod: 'Credit Card'
            };
            
            log('Creating order', 'info');
            allureReporter.createJsonAttachment('Order Request Data', orderData);
            
            // Step 4: Create order
            const orderResult = await this.apiClient.createOrder(this.token, orderData);
            
            if (!orderResult.success) {
                log('Failed to create order: ${orderResult.message}', 'error');
                await this.teardown(false, orderResult.message);
                return {
                    success: false,
                    error: orderResult.message
                };
            }
            
            log('Order created successfully', 'success');
            allureReporter.createJsonAttachment('Order Response', orderResult.order);
            
            // Step 5: Get all orders
            log('Getting all orders', 'info');
            const ordersResult = await this.apiClient.getOrders(this.token);
            
            if (!ordersResult.success) {
                log('Failed to get orders: ${ordersResult.message}', 'error');
                await this.teardown(false, ordersResult.message);
                return {
                    success: false,
                    error: ordersResult.message
                };
            }
            
            log('Retrieved ${ordersResult.orders.length} orders', 'success');
            allureReporter.createJsonAttachment('All Orders', ordersResult.orders);
            
            // Step 6: Verify the created order exists in the order list
            const createdOrderExists = ordersResult.orders.some(order => 
                order._id === orderResult.order._id);
            
            if (!createdOrderExists) {
                const errorMessage = 'Created order not found in order list';
                log(errorMessage, 'error');
                await this.teardown(false, errorMessage);
                return {
                    success: false,
                    error: errorMessage
                };
            }
            
            log('Created order found in order list', 'success');
            
            // Complete test
            await this.teardown(true);
            await this.generateReport();
            
            return {
                success: true,
                message: 'Order API tests completed successfully'
            };
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
    const test = new OrderApiTest();
    
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

module.exports = OrderApiTest;
