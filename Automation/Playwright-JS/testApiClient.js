// Test script to verify ApiClient.js
const ApiClient = require('./utils/api/ApiClient');
const config = require('./config/config');

async function testApiClient() {
    try {
        console.log('Testing ApiClient in browserless mode...');
        
        // Create API client in browserless mode
        const apiClient = new ApiClient(null);
        
        // Attempt login
        const credentials = {
            email: config.testData.userEmail,
            password: config.testData.userPassword
        };
        
        console.log(`Attempting login with: ${credentials.email}`);
        const loginResult = await apiClient.login(credentials.email, credentials.password);
        
        if (loginResult.success) {
            console.log('✅ Login successful!');
            console.log('Token:', loginResult.token.substring(0, 15) + '...');
            
            // Try getting products
            console.log('\nFetching products...');
            const productsResult = await apiClient.getAllProducts(loginResult.token);
            
            if (productsResult.success) {
                console.log('✅ Products fetched successfully!');
                console.log(`Found ${productsResult.products.length} products`);
                
                if (productsResult.products.length > 0) {
                    console.log('Sample product:', productsResult.products[0].title || productsResult.products[0].name);
                }
            } else {
                console.log('❌ Failed to fetch products:', productsResult.message);
            }
        } else {
            console.log('❌ Login failed:', loginResult.message);
        }
    } catch (error) {
        console.error('❌ Error running test:', error.message);
    }
}

// Run the test
testApiClient();
