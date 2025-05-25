// ProductDetailsTest.js
// Test for product details page functionality

const BaseTest = require('../BaseTest');
const LoginPage = require('../../pages/LoginPage');
const DashboardPage = require('../../pages/DashboardPage');
const ProductDetailsPage = require('../../pages/ProductDetailsPage');
const { log } = require('../../utils/logger/Logger');
const Utils = require('../../utils/helpers/Utils');
const config = require('../../config/config');

/**
 * Product Details Test
 */
class ProductDetailsTest extends BaseTest {
    constructor() {
        super({
            testName: 'Product Details Test',
            testDescription: 'This test verifies that the product details page displays correct information and functionality.',
            tags: ['regression'],
            cleanAllure: false,
            database: false
        });
        
        this.credentials = null;
    }
    
    /**
     * Run the test
     * @returns {Promise<{success: boolean, error?: string, productDetails?: Object}>}
     */
    async run() {
        try {
            // Setup
            await this.setup();
            
            // Create page objects
            const loginPage = new LoginPage(this.page);
            const dashboardPage = new DashboardPage(this.page);
            const productDetailsPage = new ProductDetailsPage(this.page);
            
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
            
            // Step 4: Get products and select first product
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
            
            log('Found ${products.length} products on dashboard', 'success');
            
            // Select the first product
            const selectedProduct = products[0];
            log('Selecting product: ${selectedProduct.title}', 'info');
            
            // Step 5: View product details
            log('Viewing product details', 'info');
            await dashboardPage.viewProductDetails(0);
            await this.takeScreenshot('Product Details Page');
            
            // Step 6: Verify product details
            const productTitle = await productDetailsPage.getProductTitle();
            const productPrice = await productDetailsPage.getProductPrice();
            const productDescription = await productDetailsPage.getProductDescription();
            const imageCount = await productDetailsPage.getImageCount();
            
            log('Product Title: ${productTitle}', 'info');
            log('Product Price: ${productPrice}', 'info');
            log('Product Description: ${productDescription.substring(0, 100)}...', 'info');
            log('Product Images: ${imageCount}', 'info');
            
            // Verify product details are populated
            const isDetailsDisplayed = productTitle && productPrice;
            
            if (!isDetailsDisplayed) {
                log('Product details not displayed correctly', 'error');
                await this.teardown(false, 'Product details not displayed correctly');
                return {
                    success: false,
                    error: 'Product details not displayed correctly'
                };
            }
            
            log('Product details displayed correctly', 'success');
            
            // Step 7: Check quantity selector functionality
            try {
                await productDetailsPage.selectQuantity('2');
                log('Quantity selection successful', 'success');
            } catch (error) {
                log('Quantity selection not available: ${error.message}', 'warn');
            }
            
            // Complete test
            await this.teardown(true);
            
            return {
                success: true,
                productDetails: {
                    title: productTitle,
                    price: productPrice,
                    description: productDescription.substring(0, 100) + '...',
                    imageCount: imageCount
                }
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
    const test = new ProductDetailsTest();
    
    test.run()
        .then(result => {
            if (result.success) {
                log('Test completed successfully!', 'success');
                
                if (result.productDetails) {
                    log('Product Details: ${result.productDetails.title} - ${result.productDetails.price}', 'info');
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

module.exports = ProductDetailsTest;
