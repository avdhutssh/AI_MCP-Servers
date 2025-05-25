// ProductCatalogTest.js
// Test to verify product catalog functionality

const BaseTest = require('../BaseTest');
const LoginPage = require('../../pages/LoginPage');
const DashboardPage = require('../../pages/DashboardPage');
const ApiClient = require('../../utils/api/ApiClient');
const Utils = require('../../utils/helpers/Utils');
const { log } = require('../../utils/logger/Logger');
const config = require('../../config/config');

/**
 * Product Catalog Test
 */
class ProductCatalogTest extends BaseTest {
    constructor() {
        super({
            testName: 'Product Catalog Test',
            testDescription: 'This test verifies that the product catalog loads correctly and displays expected products.',
            cleanAllure: false,
            database: false
        });
        
        this.credentials = null;
    }
    
    /**
     * Run the test
     * @returns {Promise<{success: boolean, error?: string}>}
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
            
            // Step 4: Get and verify products
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
            
            // Log first few products for verification
            products.slice(0, 3).forEach((product, index) => {
                log('Product ${index + 1}: ${product.title} - ${product.price}', 'info');
            });
            
            // Step 5: Compare with API products (optional verification)
            log('Getting products from API for verification', 'info');
            const loginResult = await apiClient.login(this.credentials.email, this.credentials.password);
            
            if (loginResult.success) {
                const apiProductResult = await apiClient.getProductList(loginResult.token);
                
                if (apiProductResult.success) {
                    log('API returned ${apiProductResult.products.length} products', 'info');
                    
                    // Verify count roughly matches (may be pagination differences)
                    const countDiff = Math.abs(products.length - apiProductResult.products.length);
                    const isCountSimilar = countDiff <= products.length * 0.2; // Allow 20% difference
                    
                    log(`Product count verification: ${isCountSimilar ? 'Passed' : 'Warning - counts differ significantly'}`, 
                        isCountSimilar ? 'success' : 'warn');
                }
            }
            
            // Complete test
            await this.teardown(true);
            
            return {
                success: true,
                productCount: products.length
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
    const test = new ProductCatalogTest();
    
    test.run()
        .then(result => {
            if (result.success) {
                log('Test completed successfully!', 'success');
                log('Found ${result.productCount} products', 'info');
                
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

module.exports = ProductCatalogTest;
