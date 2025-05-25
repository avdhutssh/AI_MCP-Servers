// AddToCartTest.js
// Test for adding products to cart functionality

const BaseTest = require('../BaseTest');
const LoginPage = require('../../pages/LoginPage');
const DashboardPage = require('../../pages/DashboardPage');
const CartPage = require('../../pages/CartPage');
const { log } = require('../../utils/logger/Logger');
const Utils = require('../../utils/helpers/Utils');
const config = require('../../config/config');

/**
 * Add To Cart Test
 */
class AddToCartTest extends BaseTest {
    constructor() {
        super({
            testName: 'Add To Cart Test',
            testDescription: 'This test verifies that products can be added to the shopping cart successfully.',
            tags: ['smoke', 'critical', 'regression'],
            cleanAllure: false,
            database: false
        });
        
        this.credentials = null;
    }
    
    /**
     * Run the test
     * @returns {Promise<{success: boolean, error?: string, productAdded?: Object}>}
     */
    async run() {
        try {
            // Setup
            await this.setup();
            
            // Create page objects
            const loginPage = new LoginPage(this.page);
            const dashboardPage = new DashboardPage(this.page);
            const cartPage = new CartPage(this.page);
            
            // Step 1: Read credentials from Excel file
            log('Reading credentials from Excel file', 'info');
            
            try {
                const excelData = await Utils.readFromExcel(
                    `${config.outputDir}/${config.excelFile}`
                );
                
                if (excelData.length === 0) {
                    throw new Error('No credentials found in Excel file');
                }
                
                // Use the most recent credentials
                this.credentials = excelData[excelData.length - 1];
                log(`Using credentials for: ${this.credentials.email}`, 'info');
            } catch (error) {
                log(`Error reading Excel data: ${error.message}. Test cannot continue without valid credentials.`, 'error');
                await this.teardown(false, error.message);
                return {
                    success: false,
                    error: `No valid credentials found: ${error.message}`
                };
            }
            
            // Step 2: Navigate to login page and login
            log('Navigating to login page', 'info');
            await loginPage.navigate(config.baseUrl);
            
            log(`Logging in with email: ${this.credentials.email}`, 'info');
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
            
            // Step 4: Get products and select one to add to cart
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
            
            log(`Found ${products.length} products on dashboard`, 'success');
            
            // Select the first product
            const selectedProduct = products[0];
            log(`Adding product to cart: ${selectedProduct.title}`, 'info');
            
            // Step 5: Add product to cart
            const isAdded = await dashboardPage.addProductToCart(selectedProduct.title);
            await this.takeScreenshot('After Adding to Cart');
            
            if (!isAdded) {
                log(`Failed to add product to cart: ${selectedProduct.title}`, 'error');
                await this.teardown(false, `Failed to add product to cart: ${selectedProduct.title}`);
                return {
                    success: false,
                    error: `Failed to add product to cart: ${selectedProduct.title}`
                };
            }
            
            log(`Successfully added product to cart: ${selectedProduct.title}`, 'success');
            
            // Step 6: Navigate to cart
            log('Navigating to cart page', 'info');
            await dashboardPage.goToCart();
            await this.takeScreenshot('Cart Page');
            
            // Step 7: Verify product is in cart
            const cartItems = await cartPage.getCartItems();
            const isProductInCart = await cartPage.isProductInCart(selectedProduct.title);
            
            if (!isProductInCart) {
                log(`Product not found in cart: ${selectedProduct.title}`, 'error');
                await this.teardown(false, `Product not found in cart: ${selectedProduct.title}`);
                return {
                    success: false,
                    error: `Product not found in cart: ${selectedProduct.title}`
                };
            }
            
            log(`Product found in cart: ${selectedProduct.title}`, 'success');
            log(`Total items in cart: ${cartItems.length}`, 'info');
            
            // Step 8: Get cart total
            const totalAmount = await cartPage.getTotalAmount();
            log(`Cart total amount: ${totalAmount}`, 'info');
            
            // Complete test
            await this.teardown(true);
            
            return {
                success: true,
                productAdded: selectedProduct,
                cartItems: cartItems.length,
                totalAmount: totalAmount
            };
        } catch (error) {
            log(`Test execution error: ${error.message}`, 'error');
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
    const test = new AddToCartTest();
    
    test.run()
        .then(result => {
            if (result.success) {
                log('Test completed successfully!', 'success');
                log(`Product added to cart: ${result.productAdded.title}`, 'info');
                log(`Cart total: ${result.totalAmount}`, 'info');
                
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

module.exports = AddToCartTest;
