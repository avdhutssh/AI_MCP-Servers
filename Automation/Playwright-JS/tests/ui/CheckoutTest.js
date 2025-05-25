// CheckoutTest.js
// Test for checkout process

const BaseTest = require('../BaseTest');
const LoginPage = require('../../pages/LoginPage');
const DashboardPage = require('../../pages/DashboardPage');
const CartPage = require('../../pages/CartPage');
const CheckoutPage = require('../../pages/CheckoutPage');
const { log } = require('../../utils/logger/Logger');
const Utils = require('../../utils/helpers/Utils');
const config = require('../../config/config');

/**
 * Checkout Test
 */
class CheckoutTest extends BaseTest {
    constructor() {
        super({
            testName: 'Checkout Test',
            testDescription: 'This test verifies that the checkout process works correctly.',
            tags: ['smoke', 'critical', 'regression'],
            cleanAllure: false,
            database: false
        });
        
        this.credentials = null;
        this.orderID = null;
    }
    
    /**
     * Run the test
     * @returns {Promise<{success: boolean, error?: string, orderID?: string}>}
     */
    async run() {
        try {
            // Setup
            await this.setup();
            
            // Create page objects
            const loginPage = new LoginPage(this.page);
            const dashboardPage = new DashboardPage(this.page);
            const cartPage = new CartPage(this.page);
            const checkoutPage = new CheckoutPage(this.page);
            
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
            await this.takeScreenshot('Dashboard');
            
            // Step 4: Get products and add one to cart
            log('Getting products from dashboard', 'info');
            const products = await dashboardPage.getProducts();
            
            if (products.length === 0) {
                log('No products found on dashboard', 'error');
                await this.teardown(false, 'No products found on dashboard');
                return {
                    success: false,
                    error: 'No products found on dashboard'
                };
            }
            
            // Select the first product
            const selectedProduct = products[0];
            log('Adding product to cart: ${selectedProduct.title}', 'info');
            
            const isAdded = await dashboardPage.addProductToCart(selectedProduct.title);
            
            if (!isAdded) {
                log('Failed to add product to cart: ${selectedProduct.title}', 'error');
                await this.teardown(false, 'Failed to add product to cart: ${selectedProduct.title}');
                return {
                    success: false,
                    error: 'Failed to add product to cart: ${selectedProduct.title}'
                };
            }
            
            log('Successfully added product to cart: ${selectedProduct.title}', 'success');
            
            // Step 5: Navigate to cart
            log('Navigating to cart page', 'info');
            await dashboardPage.goToCart();
            await this.takeScreenshot('Cart Page');
            
            // Step 6: Verify product is in cart
            const isProductInCart = await cartPage.isProductInCart(selectedProduct.title);
            
            if (!isProductInCart) {
                log('Product not found in cart: ${selectedProduct.title}', 'error');
                await this.teardown(false, 'Product not found in cart: ${selectedProduct.title}');
                return {
                    success: false,
                    error: 'Product not found in cart: ${selectedProduct.title}'
                };
            }
            
            log('Product found in cart: ${selectedProduct.title}', 'success');
            
            // Step 7: Proceed to checkout
            log('Proceeding to checkout', 'info');
            await cartPage.proceedToCheckout();
            await this.takeScreenshot('Checkout Page');
            
            // Step 8: Fill checkout form
            log('Filling checkout form', 'info');
            
            // Select country
            log('Selecting country: India', 'info');
            await checkoutPage.selectCountry('India');
            
            // Enter payment details
            log('Entering payment details', 'info');
            await checkoutPage.enterPaymentDetails({
                cvv: '123',
                nameOnCard: 'Test User'
            });
            
            await this.takeScreenshot('Checkout Form Filled');
            
            // Step 9: Place order
            log('Placing order', 'info');
            await checkoutPage.placeOrder();
            await this.takeScreenshot('Order Confirmation');
            
            // Step 10: Verify order confirmation
            const isOrderPlaced = await checkoutPage.isOrderPlacedSuccessfully();
            
            if (!isOrderPlaced) {
                log('Order placement failed', 'error');
                await this.teardown(false, 'Order placement failed');
                return {
                    success: false,
                    error: 'Order placement failed'
                };
            }
            
            log('Order placed successfully', 'success');
            
            // Get order ID
            try {
                this.orderID = await checkoutPage.getOrderID();
                log('Order ID: ${this.orderID}', 'info');
            } catch (error) {
                log('Could not get order ID: ${error.message}', 'warn');
            }
            
            // Complete test
            await this.teardown(true);
            
            return {
                success: true,
                orderID: this.orderID
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
    const test = new CheckoutTest();
    
    test.run()
        .then(result => {
            if (result.success) {
                log('Test completed successfully!', 'success');
                
                if (result.orderID) {
                    log('Order ID: ${result.orderID}', 'info');
                }
                
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

module.exports = CheckoutTest;
