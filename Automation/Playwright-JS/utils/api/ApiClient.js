// ApiClient.js
// API client for interacting with the application APIs

const { log } = require('../logger/Logger');
const config = require('../../config/config');

/**
 * API client for the application
 */
class ApiClient {
    /**
     * Initialize API client
     * @param {import('@playwright/test').Page} page - Playwright page object
     */
    constructor(page) {
        this.page = page;
        this.baseApiUrl = config.baseUrl.replace('/client', '');
    }
    
    /**
     * Login via API
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<{success: boolean, token?: string, userId?: string, message?: string}>} 
     */
    async login(email, password) {
        log(`Attempting API login for: ${email}`, 'info');
        
        try {
            // Create the request payload
            const payload = {
                userEmail: email,
                userPassword: password
            };
            
            // Send the login request
            const loginResponse = await this.page.request.post(
                `${this.baseApiUrl}/api/ecom/auth/login`, 
                {
                    data: payload,
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            // Parse response
            const responseData = await loginResponse.json();
            
            if (loginResponse.ok() && responseData.token) {
                log('API Login successful', 'success');
                return {
                    success: true,
                    token: responseData.token,
                    userId: responseData.userId
                };
            } else {
                log(`API Login failed: ${responseData.message || 'Unknown error'}`, 'error');
                return {
                    success: false,
                    message: responseData.message || 'Unknown error'
                };
            }
        } catch (error) {
            log(`API Login error: ${error.message}`, 'error');
            return {
                success: false,
                message: error.message
            };
        }
    }
    
    /**
     * Get user profile information
     * @param {string} token - Authentication token
     * @returns {Promise<{success: boolean, profile?: Object, message?: string}>}
     */
    async getUserProfile(token) {
        try {
            const response = await this.page.request.get(
                `${this.baseApiUrl}/api/ecom/user/profile`, 
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                }
            );
            
            const data = await response.json();
            
            if (response.ok()) {
                return {
                    success: true,
                    profile: data
                };
            } else {
                return {
                    success: false,
                    message: data.message || 'Failed to get user profile'
                };
            }
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }
    
    /**
     * Get product list
     * @param {string} token - Authentication token
     * @returns {Promise<{success: boolean, products?: Array, message?: string}>}
     */
    async getProductList(token) {
        try {
            const response = await this.page.request.get(
                `${this.baseApiUrl}/api/ecom/product/get-all-products`, 
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                }
            );
            
            const data = await response.json();
            
            if (response.ok() && Array.isArray(data.data)) {
                return {
                    success: true,
                    products: data.data
                };
            } else {
                return {
                    success: false,
                    message: data.message || 'Failed to get product list'
                };
            }
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }
}

module.exports = ApiClient;
