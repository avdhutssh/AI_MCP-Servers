// OrderHistoryTest.js
// Test for order history functionality

const BaseTest = require('../BaseTest');
const LoginPage = require('../../pages/LoginPage');
const DashboardPage = require('../../pages/DashboardPage');
const OrdersPage = require('../../pages/OrdersPage');
const { log } = require('../../utils/logger/Logger');
const Utils = require('../../utils/helpers/Utils');
const config = require('../../config/config');

/**
 * Order History Test
 */
class OrderHistoryTest extends BaseTest {
    constructor() {
        super({
            testName: 'Order History Test',
            testDescription: 'This test verifies that order history displays correctly.',
            tags: ['regression'],
            cleanAllure: false,
            database: false
        });
        
        this.credentials = null;
    }
    
    /**
     * Run the test
     * @param {string} specificOrderID - Optional specific order ID to verify
     * @returns {Promise<{success: boolean, error?: string, orderCount?: number, orders?: Array}>}
     */
    async run(specificOrderID = null) {
        try {
            // Setup
            await this.setup();
            
            // Create page objects
            const loginPage = new LoginPage(this.page);
            const dashboardPage = new DashboardPage(this.page);
            const ordersPage = new OrdersPage(this.page);
            
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
            
            // Step 2: Navigate to login page and login
            log('Navigating to login page', 'info');
            await loginPage.navigate(config.baseUrl);
            
            log('Logging in with email: ${this.credentials.email}', 'info');
            await loginPage.login(this.credentials.email, this.credentials.password);
            await this.takeScreenshot('After Login');
            
            // Step 3: Verify dashboard is loaded
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
            
            // Step 4: Navigate to orders page
            log('Navigating to orders page', 'info');
            await dashboardPage.goToOrders();
            await this.takeScreenshot('Orders Page');
            
            // Step 5: Get order count
            const orderCount = await ordersPage.getOrderCount();
            log('Found ${orderCount} orders in history', 'info');
            
            if (orderCount === 0) {
                log('No orders found in history. This might be expected for a new user.', 'warn');
                await this.teardown(true);
                return {
                    success: true,
                    orderCount: 0,
                    orders: []
                };
            }
            
            // Step 6: Get order IDs
            const orderIDs = await ordersPage.getOrderIDs();
            log('Order IDs: ${orderIDs.join(', ')}', 'info');
            
            // Step 7: Check for specific order ID if provided
            if (specificOrderID) {
                log('Checking for specific order ID: ${specificOrderID}', 'info');
                const orderExists = await ordersPage.isOrderExist(specificOrderID);
                
                if (orderExists) {
                    log('Order found: ${specificOrderID}', 'success');
                    
                    // View order details
                    log('Viewing details for order: ${specificOrderID}', 'info');
                    const viewed = await ordersPage.viewOrderByID(specificOrderID);
                    
                    if (viewed) {
                        await this.takeScreenshot('Order Details');
                        const orderStatus = await ordersPage.getOrderStatus();
                        log('Order status: ${orderStatus}', 'info');
                    }
                } else {
                    log('Order not found: ${specificOrderID}', 'warn');
                }
            } else if (orderCount > 0) {
                // If no specific order ID, view first order
                log('Viewing details for first order', 'info');
                await ordersPage.viewOrderDetails(0);
                await this.takeScreenshot('Order Details');
                
                const orderStatus = await ordersPage.getOrderStatus();
                log('Order status: ${orderStatus}', 'info');
            }
            
            // Complete test
            await this.teardown(true);
            
            return {
                success: true,
                orderCount: orderCount,
                orders: orderIDs
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
    const test = new OrderHistoryTest();
    const args = process.argv.slice(2);
    const specificOrderID = args.length > 0 ? args[0] : null;
    
    test.run(specificOrderID)
        .then(result => {
            if (result.success) {
                log('Test completed successfully!', 'success');
                log('Found ${result.orderCount} orders in history', 'info');
                
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

module.exports = OrderHistoryTest;
