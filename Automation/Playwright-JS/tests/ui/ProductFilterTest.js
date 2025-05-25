// ProductFilterTest.js
// Test for product filtering functionality

const BaseTest = require('../BaseTest');
const LoginPage = require('../../pages/LoginPage');
const DashboardPage = require('../../pages/DashboardPage');
const ApiClient = require('../../utils/api/ApiClient');
const { log } = require('../../utils/logger/Logger');
const config = require('../../config/config');

/**
 * Product Filter Test
 */
class ProductFilterTest extends BaseTest {
    constructor() {
        super({
            testName: 'Product Filter Test',
            testDescription: 'This test verifies that products can be filtered by different criteria.',
            database: true
        });
        
        this.credentials = {
            email: config.testData.userEmail,
            password: config.testData.userPassword
        };
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
            const dashboardPage = new DashboardPage(this.page);
            const apiClient = new ApiClient(this.page);
            
            // Step 1: Login via API for faster execution
            log('Logging in via API', 'info');
            const loginResult = await apiClient.login(this.credentials.email, this.credentials.password);
            
            if (!loginResult.success) {
                log('API Login failed: ${loginResult.message}', 'error');
                await this.teardown(false, loginResult.message);
                return {
                    success: false,
                    error: loginResult.message
                };
            }
            
            log('API Login successful', 'success');
            
            // Step 2: Navigate to dashboard
            log('Navigating to dashboard', 'info');
            await dashboardPage.navigate(config.baseUrl);
            await this.takeScreenshot('Dashboard');
            
            // Step 3: Apply price filter
            log('Applying price filter', 'info');
            await dashboardPage.applyPriceFilter(100, 500);
            await this.page.waitForTimeout(1000); // Wait for filter to apply
            await this.takeScreenshot('Price Filter Applied');
            
            // Step 4: Verify products are filtered by price
            log('Verifying price filter results', 'info');
            const priceFilterResults = await dashboardPage.getProductPrices();
            const priceFilterValid = priceFilterResults.every(price => price >= 100 && price <= 500);
            
            if (!priceFilterValid) {
                const errorMessage = 'Price filter not working correctly. Found products outside price range.';
                log(errorMessage, 'error');
                await this.teardown(false, errorMessage);
                return {
                    success: false,
                    error: errorMessage
                };
            }
            
            log('Price filter working correctly', 'success');
            
            // Step 5: Clear price filter
            log('Clearing price filter', 'info');
            await dashboardPage.clearFilters();
            await this.takeScreenshot('Filters Cleared');
            
            // Step 6: Apply category filter
            log('Applying category filter', 'info');
            await dashboardPage.applyCategoryFilter('electronics');
            await this.page.waitForTimeout(1000); // Wait for filter to apply
            await this.takeScreenshot('Category Filter Applied');
            
            // Step 7: Verify products are filtered by category
            log('Verifying category filter results', 'info');
            const categoryFilterResults = await dashboardPage.getProductCategories();
            const categoryFilterValid = categoryFilterResults.every(category => 
                category.toLowerCase().includes('electronics'));
            
            if (!categoryFilterValid) {
                const errorMessage = 'Category filter not working correctly. Found products from other categories.';
                log(errorMessage, 'error');
                await this.teardown(false, errorMessage);
                return {
                    success: false,
                    error: errorMessage
                };
            }
            
            log('Category filter working correctly', 'success');
            
            // Step 8: Apply brand filter along with category
            log('Applying brand filter', 'info');
            await dashboardPage.applyBrandFilter('Samsung');
            await this.page.waitForTimeout(1000); // Wait for filter to apply
            await this.takeScreenshot('Brand Filter Applied');
            
            // Step 9: Verify products are filtered by brand
            log('Verifying brand filter results', 'info');
            const brandFilterResults = await dashboardPage.getProductBrands();
            const brandFilterValid = brandFilterResults.every(brand => 
                brand.toLowerCase().includes('samsung'));
            
            if (!brandFilterValid) {
                const errorMessage = 'Brand filter not working correctly. Found products from other brands.';
                log(errorMessage, 'error');
                await this.teardown(false, errorMessage);
                return {
                    success: false,
                    error: errorMessage
                };
            }
            
            log('Brand filter working correctly', 'success');
            
            // Step 10: Apply multiple filters together
            log('Applying multiple filters', 'info');
            await dashboardPage.clearFilters();
            await dashboardPage.applyPriceFilter(200, 800);
            await dashboardPage.applyCategoryFilter('electronics');
            await dashboardPage.applyRatingFilter(4); // 4 stars and above
            await this.page.waitForTimeout(1000); // Wait for filters to apply
            await this.takeScreenshot('Multiple Filters Applied');
            
            // Step 11: Verify multiple filters work together
            log('Verifying multiple filter results', 'info');
            const multiFilterProductCount = await dashboardPage.getProductCount();
            
            log('Found ${multiFilterProductCount} products with multiple filters', 'info');
            
            // Complete test
            await this.teardown(true);
            await this.generateReport();
            
            return {
                success: true,
                message: 'Product filter test completed successfully'
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
    const test = new ProductFilterTest();
    
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

module.exports = ProductFilterTest;
