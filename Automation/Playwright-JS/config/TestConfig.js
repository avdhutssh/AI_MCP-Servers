// TestConfig.js
// Test configuration including tags and dependencies

/**
 * Test configuration class
 */
class TestConfig {
    constructor() {        // Define data sources
        this.dataSources = {
            "users": {
                type: "excel",
                path: "./data/excel/users.xlsx",
                sheet: "Users",
                fallback: [
                    {
                        email: "test1@example.com",
                        password: "Test@123",
                        firstName: "John",
                        lastName: "Doe"
                    },
                    {
                        email: "test2@example.com",
                        password: "Test@123",
                        firstName: "Jane",
                        lastName: "Smith"
                    }
                ]
            },
            "products": {
                type: "json",
                path: "./data/json/products.json",
                fallback: [
                    {
                        name: "Product 1",
                        price: 19.99,
                        category: "electronics"
                    },
                    {
                        name: "Product 2",
                        price: 29.99,
                        category: "clothing"                    }
                ]
            },
            "addresses": {
                type: "json",
                path: "./data/json/addresses.json",
                fallback: [
                    {
                        street: "123 Main St",
                        city: "New York",
                        state: "NY",
                        zipCode: "10001",
                        country: "USA"
                    },
                    {
                        street: "456 Oak Ave",
                        city: "Los Angeles",
                        state: "CA",
                        zipCode: "90001",
                        country: "USA"
                    }
                ]
            }
        };
        
        this.tests = {
            // Registration and account tests
            "registration": {
                path: "tests/ui/RegistrationTest.js",
                description: "Register new user account",
                tags: ["smoke", "critical", "regression"],
                dependencies: [],
                dataSources: ["users"]
            },
            "login": {
                path: "tests/ui/LoginTest.js",
                description: "Login with existing account",
                tags: ["smoke", "critical", "regression"],
                dependencies: ["registration"],
                dataSources: ["users"]
            },
            "forgotPassword": {
                path: "tests/ui/ForgotPasswordTest.js",
                description: "Test forgot password functionality",
                tags: ["regression"],
                dependencies: ["registration"],
                dataSources: ["users"]
            },
            
            // Product tests
            "productCatalog": {
                path: "tests/ui/ProductCatalogTest.js",
                description: "Verify product catalog displays correctly",
                tags: ["smoke", "regression"],
                dependencies: ["login"],
                dataSources: ["products"]
            },
            "productSearch": {
                path: "tests/ui/ProductSearchTest.js",
                description: "Verify product search functionality",
                tags: ["regression"],
                dependencies: ["login"],
                dataSources: ["products"]
            },
            "productFilter": {
                path: "tests/ui/ProductFilterTest.js",
                description: "Verify product filtering options",
                tags: ["regression"],
                dependencies: ["login"],
                dataSources: ["products"]
            },
            "productDetails": {
                path: "tests/ui/ProductDetailsTest.js",
                description: "Verify product details page",
                tags: ["regression"],
                dependencies: ["login"],
                dataSources: ["products"]
            },
            
            // Cart and checkout tests
            "addToCart": {
                path: "tests/ui/AddToCartTest.js",
                description: "Add product to cart",
                tags: ["smoke", "critical", "regression"],
                dependencies: ["login"],
                dataSources: ["products"]
            },
            "checkout": {
                path: "tests/ui/CheckoutTest.js",
                description: "Complete checkout process",
                tags: ["smoke", "critical", "regression"],
                dependencies: ["addToCart"],
                dataSources: ["users", "addresses", "products"]
            },            "orderHistory": {
                path: "tests/ui/OrderHistoryTest.js",
                description: "View order history",
                tags: ["regression"],
                dependencies: ["checkout"],
                dataSources: ["users", "products"]
            },
            
            // API tests
            "productCatalogApi": {
                path: "tests/api/ProductCatalogApiTest.js",
                description: "Test product catalog API endpoints",
                tags: ["api", "regression"],
                dependencies: [],
                dataSources: []
            },
            "orderApi": {
                path: "tests/api/OrderApiTest.js",
                description: "Test order API endpoints",
                tags: ["api", "regression"],
                dependencies: ["productCatalogApi"],
                dataSources: ["users", "addresses"]
            }
        };
    }
    
    /**
     * Get test config by name
     * @param {string} testName - Name of the test
     * @returns {Object} Test configuration
     */
    getTest(testName) {
        return this.tests[testName];
    }
    
    /**
     * Get all tests
     * @returns {Object} All test configurations
     */
    getAllTests() {
        return this.tests;
    }
    
    /**
     * Get tests by tag
     * @param {string} tag - Tag to filter tests by
     * @returns {Object} Tests with the specified tag
     */
    getTestsByTag(tag) {
        const result = {};
        
        Object.entries(this.tests).forEach(([testName, config]) => {
            if (config.tags.includes(tag)) {
                result[testName] = config;
            }
        });
        
        return result;
    }
    
    /**
     * Get tests with dependencies resolved
     * @param {string[]} testNames - Tests to run
     * @returns {string[]} Tests in order respecting dependencies
     */
    resolveDependencies(testNames) {
        // First, collect all tests including dependencies
        const allTests = new Set();
        const addTestWithDependencies = (testName) => {
            const test = this.tests[testName];
            if (!test) return;
            
            // Add dependencies first
            test.dependencies.forEach(dep => {
                addTestWithDependencies(dep);
            });
            
            // Then add the test itself
            allTests.add(testName);
        };
        
        // Add all requested tests with their dependencies
        testNames.forEach(testName => {
            addTestWithDependencies(testName);
        });
        
        // Return as array in dependency order
        return Array.from(allTests);
    }
}

module.exports = new TestConfig();
