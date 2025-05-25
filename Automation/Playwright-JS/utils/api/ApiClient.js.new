// ApiClient.js
// API client for interacting with the application APIs

const { log } = require('../logger/Logger');
const config = require('../../config/config');
const allureReporter = require('../reporter/AllureReporter');
const fetch = require('node-fetch');

/**
 * API client for the application
 */
class ApiClient {
    /**
     * Initialize API client
     * @param {import('@playwright/test').Page} page - Playwright page object (optional)
     */
    constructor(page = null) {
        this.page = page;
        this.baseApiUrl = config.baseUrl;
        
        // Flag to determine if we're in browserless mode (no page object)
        this.browserless = page === null;
        
        if (this.browserless) {
            log('ApiClient initialized in browserless mode using node-fetch', 'info');
        } else {
            log('ApiClient initialized with Playwright page object', 'info');
        }
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
            
            let responseData;
            let statusCode;
            let success;
            
            if (this.browserless) {
                // Using node-fetch for browserless mode
                log('Performing login using node-fetch', 'info');
                const response = await fetch(`${this.baseApiUrl}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
                
                statusCode = response.status;
                responseData = await response.json();
                success = response.ok;
                
                // Record API call for reporting
                allureReporter.recordApiCall({
                    endpoint: `${this.baseApiUrl}/auth/login`,
                    method: 'POST',
                    request: payload,
                    response: responseData,
                    status: statusCode
                });
            } else {
                // Send the login request using Playwright
                const response = await this.page.request.post(
                    `${this.baseApiUrl}/auth/login`, 
                    {
                        data: payload,
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                // Parse response
                statusCode = response.status();
                responseData = await response.json();
                success = response.ok();
                
                // Record API call for reporting
                allureReporter.recordApiCall({
                    endpoint: `${this.baseApiUrl}/auth/login`,
                    method: 'POST',
                    request: payload,
                    response: responseData,
                    status: statusCode
                });
            }
            
            if (success && responseData.token) {
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
            let data;
            let statusCode;
            let success;

            if (this.browserless) {
                // Using node-fetch for browserless mode
                log('Performing get user profile using node-fetch', 'info');
                
                const response = await fetch(`${this.baseApiUrl}/user/profile`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });
                
                statusCode = response.status;
                data = await response.json();
                success = response.ok;
                
                // Record API call for reporting
                allureReporter.recordApiCall({
                    endpoint: `${this.baseApiUrl}/user/profile`,
                    method: 'GET',
                    request: { token: `${token.substring(0, 10)}...` },
                    response: data,
                    status: statusCode
                });
            } else {
                const response = await this.page.request.get(
                    `${this.baseApiUrl}/user/profile`, 
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json'
                        }
                    }
                );
                
                data = await response.json();
                statusCode = response.status();
                success = response.ok();
                
                // Record API call for reporting
                allureReporter.recordApiCall({
                    endpoint: `${this.baseApiUrl}/user/profile`,
                    method: 'GET',
                    request: { token: `${token.substring(0, 10)}...` },
                    response: data,
                    status: statusCode
                });
            }
            
            if (success) {
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
     * Get all products
     * @param {string} token - Authentication token
     * @returns {Promise<{success: boolean, products?: Array, message?: string}>}
     */
    async getAllProducts(token) {
        try {
            let data;
            let statusCode;
            let success;
            let response;

            if (this.browserless) {
                response = await fetch(`${this.baseApiUrl}/product/get-all-products`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });

                statusCode = response.status;
                data = await response.json();
                success = response.ok;
                
                // Record API call for reporting
                allureReporter.recordApiCall({
                    endpoint: `${this.baseApiUrl}/product/get-all-products`,
                    method: 'GET',
                    request: { token: `${token.substring(0, 10)}...` },
                    response: data,
                    status: statusCode
                });
            } else {
                response = await this.page.request.get(
                    `${this.baseApiUrl}/product/get-all-products`, 
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json'
                        }
                    }
                );
                
                data = await response.json();
                statusCode = response.status();
                success = response.ok();
                
                // Record API call for reporting
                allureReporter.recordApiCall({
                    endpoint: `${this.baseApiUrl}/product/get-all-products`,
                    method: 'GET',
                    request: { token: `${token.substring(0, 10)}...` },
                    response: data,
                    status: statusCode
                });
            }
            
            if (success) {
                return {
                    success: true,
                    products: data.data || data.products || data
                };
            } else {
                return {
                    success: false,
                    message: data.message || 'Failed to get products'
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
     * Get orders
     * @param {string} token - Authentication token
     * @returns {Promise<{success: boolean, orders?: Array, message?: string}>}
     */
    async getOrders(token) {
        try {
            let data;
            let statusCode;
            let success;
            let response;

            if (this.browserless) {
                response = await fetch(`${this.baseApiUrl}/order/get-orders`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });

                statusCode = response.status;
                data = await response.json();
                success = response.ok;
                
                // Record API call for reporting
                allureReporter.recordApiCall({
                    endpoint: `${this.baseApiUrl}/order/get-orders`,
                    method: 'GET',
                    request: { token: `${token.substring(0, 10)}...` },
                    response: data,
                    status: statusCode
                });
            } else {
                response = await this.page.request.get(
                    `${this.baseApiUrl}/order/get-orders`, 
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json'
                        }
                    }
                );
                
                data = await response.json();
                statusCode = response.status();
                success = response.ok();
                
                // Record API call for reporting
                allureReporter.recordApiCall({
                    endpoint: `${this.baseApiUrl}/order/get-orders`,
                    method: 'GET',
                    request: { token: `${token.substring(0, 10)}...` },
                    response: data,
                    status: statusCode
                });
            }
            
            if (success) {
                return {
                    success: true,
                    orders: data.data || data.orders || data
                };
            } else {
                return {
                    success: false,
                    message: data.message || 'Failed to get orders'
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
     * Create a new order
     * @param {string} token - Authentication token
     * @param {Array} products - Array of products to order
     * @param {Object} address - Shipping address
     * @returns {Promise<{success: boolean, orderId?: string, message?: string}>}
     */
    async createOrder(token, products, address) {
        try {
            // Prepare order payload
            const orderPayload = {
                orders: products,
                shippingAddress: address
            };
            
            let data;
            let statusCode;
            let success;

            if (this.browserless) {
                // Using node-fetch for browserless mode
                log('Creating order using node-fetch', 'info');
                
                const response = await fetch(`${this.baseApiUrl}/order/create-order`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(orderPayload)
                });
                
                statusCode = response.status;
                data = await response.json();
                success = response.ok;
                
                // Record API call for reporting
                allureReporter.recordApiCall({
                    endpoint: `${this.baseApiUrl}/order/create-order`,
                    method: 'POST',
                    request: { token: `${token.substring(0, 10)}...`, orderPayload },
                    response: data,
                    status: statusCode
                });
            } else {
                const response = await this.page.request.post(
                    `${this.baseApiUrl}/order/create-order`, 
                    {
                        data: orderPayload,
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                data = await response.json();
                statusCode = response.status();
                success = response.ok();
                
                // Record API call for reporting
                allureReporter.recordApiCall({
                    endpoint: `${this.baseApiUrl}/order/create-order`,
                    method: 'POST',
                    request: { token: `${token.substring(0, 10)}...`, orderPayload },
                    response: data,
                    status: statusCode
                });
            }
            
            if (success) {
                return {
                    success: true,
                    orderId: data.orderId || data.data?.orderId
                };
            } else {
                return {
                    success: false,
                    message: data.message || 'Failed to create order'
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
