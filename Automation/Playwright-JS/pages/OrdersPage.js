// OrdersPage.js
// Contains all orders page related locators and actions

class OrdersPage {
    constructor(page) {
        this.page = page;
        
        // Locators
        this.orderRows = this.page.locator('table tbody tr');
        this.orderIDs = this.page.locator('table tbody tr th');
        this.viewButtons = this.page.locator('table tbody tr button.btn-primary');
        this.orderStatus = this.page.locator('p.statusText');
        this.orderHeading = this.page.locator('h1.hero-primary');
    }
    
    /**
     * Get order count
     * @returns {Promise<number>} Number of orders
     */
    async getOrderCount() {
        return await this.orderRows.count();
    }
    
    /**
     * Get list of order IDs
     * @returns {Promise<Array<string>>} List of order IDs
     */
    async getOrderIDs() {
        return await this.orderIDs.allTextContents();
    }
    
    /**
     * Check if order exists by ID
     * @param {string} orderID - Order ID to check
     * @returns {Promise<boolean>} True if order exists
     */
    async isOrderExist(orderID) {
        const orderIDs = await this.getOrderIDs();
        return orderIDs.some(id => id.includes(orderID));
    }
    
    /**
     * View order details by index
     * @param {number} index - Order index (0-based)
     */
    async viewOrderDetails(index) {
        await this.viewButtons.nth(index).click();
        await this.page.waitForLoadState('networkidle');
    }
    
    /**
     * View order details by ID
     * @param {string} orderID - Order ID to view
     * @returns {Promise<boolean>} True if order was found and viewed
     */
    async viewOrderByID(orderID) {
        const orderIDs = await this.getOrderIDs();
        const index = orderIDs.findIndex(id => id.includes(orderID));
        
        if (index !== -1) {
            await this.viewButtons.nth(index).click();
            await this.page.waitForLoadState('networkidle');
            return true;
        }
        
        return false;
    }
    
    /**
     * Get order status
     * @returns {Promise<string>} Order status
     */
    async getOrderStatus() {
        return await this.orderStatus.textContent();
    }
    
    /**
     * Get order heading
     * @returns {Promise<string>} Order heading text
     */
    async getOrderHeading() {
        return await this.orderHeading.textContent();
    }
}

module.exports = OrdersPage;
