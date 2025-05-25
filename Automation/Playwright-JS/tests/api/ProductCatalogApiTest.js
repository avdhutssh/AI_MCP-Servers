// ProductCatalogApiTest.js
// API test for product catalog operations

const ApiBaseTest = require('../ApiBaseTest');
const { log } = require('../../utils/logger/Logger');
const allureReporter = require('../../utils/reporter/AllureReporter');
const config = require('../../config/config');

/**
 * Product Catalog API Test
 */
class ProductCatalogApiTest extends ApiBaseTest {
    constructor() {
        super({
            testName: 'Product Catalog API Test',
            testDescription: 'This test verifies product catalog API operations.',
            cleanAllure: true
        });
    }
    
    /**
     * Run the test
     * @returns {Promise<{success: boolean, message?: string, error?: string}>}
     */
    async run() {
        try {
            // Setup
            await this.setup();
            
            // Step 1: Get all products
            log('Getting all products', 'info');
            const productsResult = await this.apiClient.getProducts();
            
            if (!productsResult.success) {
                log('Failed to get products: ${productsResult.message}', 'error');
                await this.teardown(false, productsResult.message);
                return {
                    success: false,
                    error: productsResult.message
                };
            }
            
            log('Retrieved ${productsResult.data.length} products', 'success');
            allureReporter.createJsonAttachment('All Products', productsResult.data);
            
            // Step 2: Get a specific product
            const productId = productsResult.data[0].id;
            log('Getting product details for ID: ${productId}', 'info');
            
            const productResult = await this.apiClient.getProductById(productId);
            
            if (!productResult.success) {
                log('Failed to get product details: ${productResult.message}', 'error');
                await this.teardown(false, productResult.message);
                return {
                    success: false,
                    error: productResult.message
                };
            }
            
            log('Retrieved product details successfully', 'success');
            allureReporter.createJsonAttachment('Product Details', productResult.data);
            
            // Step 3: Get products by category
            const category = 'electronics';
            log('Getting products by category: ${category}', 'info');
            
            const categoryResult = await this.apiClient.getProductsByCategory(category);
            
            if (!categoryResult.success) {
                log('Failed to get products by category: ${categoryResult.message}', 'error');
                await this.teardown(false, categoryResult.message);
                return {
                    success: false,
                    error: categoryResult.message
                };
            }
            
            log('Retrieved ${categoryResult.data.length} products in category: ${category}', 'success');
            allureReporter.createJsonAttachment('Category Products', categoryResult.data);
            
            // Step 4: Search for products
            const searchTerm = 'phone';
            log('Searching products with term: ${searchTerm}', 'info');
            
            const searchResult = await this.apiClient.searchProducts(searchTerm);
            
            if (!searchResult.success) {
                log('Failed to search products: ${searchResult.message}', 'error');
                await this.teardown(false, searchResult.message);
                return {
                    success: false,
                    error: searchResult.message
                };
            }
            
            log('Found ${searchResult.data.length} products matching: ${searchTerm}', 'success');
            allureReporter.createJsonAttachment('Search Results', searchResult.data);
            
            // Complete test
            await this.teardown(true);
            await this.generateReport();
            
            return {
                success: true,
                message: 'Product catalog API tests completed successfully'
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
    const test = new ProductCatalogApiTest();
    
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

module.exports = ProductCatalogApiTest;
