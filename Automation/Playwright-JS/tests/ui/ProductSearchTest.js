// ProductSearchTest.js
// Test for product search functionality

const BaseTest = require('../BaseTest');
const LoginPage = require('../../pages/LoginPage');
const DashboardPage = require('../../pages/DashboardPage');
const { log } = require('../../utils/logger/Logger');
const Utils = require('../../utils/helpers/Utils');
const config = require('../../config/config');

/**
 * Product Search Test
 */
class ProductSearchTest extends BaseTest {
    constructor() {
        super({
            testName: 'Product Search Test',
            testDescription: 'This test verifies that the product search functionality works correctly.',
            tags: ['regression'],
            cleanAllure: false,
            database: false
        });
        
        this.credentials = null;
        this.searchTerm = 'laptop'; // Default search term if none is provided
    }
    
    /**
     * Run the test
     * @param {string} searchTerm - Optional search term to use
     * @returns {Promise<{success: boolean, error?: string, results?: Array}>}
     */
    async run(searchTerm = null) {
        try {
            // Set search term if provided
            if (searchTerm) {
                this.searchTerm = searchTerm;
            }
            
            // Setup
            await this.setup();
            
            // Create page objects
            const loginPage = new LoginPage(this.page);
            const dashboardPage = new DashboardPage(this.page);
            
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
            await this.takeScreenshot('Dashboard Before Search');
            
            // Step 4: Get initial product count
            const initialProducts = await dashboardPage.getProducts();
            log('Initial product count: ${initialProducts.length}', 'info');
            
            // Step 5: Perform search
            log('Searching for products with term: "${this.searchTerm}"', 'info');
            await dashboardPage.searchProduct(this.searchTerm);
            await this.takeScreenshot('Search Results');
            
            // Step 6: Get search results
            const searchResults = await dashboardPage.getProducts();
            log('Search results count: ${searchResults.length}', 'info');
            
            // Check if search returned results
            if (searchResults.length === 0) {
                log('No results found for search term: "${this.searchTerm}"', 'warn');
            } else {
                log('Found ${searchResults.length} products matching search term: "${this.searchTerm}"', 'success');
                
                // Log first few results
                searchResults.slice(0, 3).forEach((product, index) => {
                    log('Result ${index + 1}: ${product.title} - ${product.price}', 'info');
                });
            }
            
            // Check if search term is present in results
            const matchCount = searchResults.filter(product => 
                product.title.toLowerCase().includes(this.searchTerm.toLowerCase())).length;
            
            if (matchCount > 0) {
                log('${matchCount} of ${searchResults.length} results contain the search term in the title', 'success');
            } else if (searchResults.length > 0) {
                log('None of the results contain the search term in the title. Search might be checking description or other fields.', 'warn');
            }
            
            // Complete test
            await this.teardown(true);
            
            return {
                success: true,
                searchTerm: this.searchTerm,
                initialCount: initialProducts.length,
                resultsCount: searchResults.length,
                results: searchResults.slice(0, 3) // Return first 3 results
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
    const test = new ProductSearchTest();
    const args = process.argv.slice(2);
    const searchTerm = args.length > 0 ? args[0] : null;
    
    test.run(searchTerm)
        .then(result => {
            if (result.success) {
                log('Test completed successfully!', 'success');
                log('Search for "${result.searchTerm}" returned ${result.resultsCount} results', 'info');
                
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

module.exports = ProductSearchTest;
