// DashboardPage.js
// Contains all dashboard page related locators and actions

class DashboardPage {
    constructor(page) {
        this.page = page;
        
        // Locators
        this.welcomeMessage = this.page.locator('label.card-subtitle');
        this.productCards = this.page.locator('.card');
        this.cartButton = this.page.locator('[routerlink*="cart"]');
        this.orderButton = this.page.locator('[routerlink*="myorders"]');
        this.signOutButton = this.page.locator('button:has-text("Sign Out")');
    }
    
    /**
     * Get welcome message text
     * @returns {Promise<string>} Welcome message text
     */
    async getWelcomeMessage() {
        return await this.welcomeMessage.textContent();
    }
    
    /**
     * Check if user is logged in
     * @returns {Promise<boolean>} True if user is logged in
     */
    async isLoggedIn() {
        return await this.signOutButton.isVisible();
    }
    
    /**
     * Get all products displayed on dashboard
     * @returns {Promise<Array<{title: string, price: string}>>} List of products
     */
    async getProducts() {
        const count = await this.productCards.count();
        const products = [];
        
        for (let i = 0; i < count; i++) {
            const card = this.productCards.nth(i);
            const title = await card.locator('h5 b').textContent();
            const price = await card.locator('h5').last().textContent();
            
            products.push({
                title,
                price
            });
        }
        
        return products;
    }
    
    /**
     * Add product to cart by name
     * @param {string} productName - Name of the product to add to cart
     * @returns {Promise<boolean>} True if product was added successfully
     */
    async addProductToCart(productName) {
        const product = this.page.locator('.card', { 
            has: this.page.locator('b', { 
                hasText: productName 
            })
        });
        
        if (await product.count() === 0) {
            return false;
        }
        
        await product.locator('button:has-text("Add To Cart")').click();
        
        // Wait for toast message
        await this.page.waitForSelector('text=Product Added To Cart');
        
        return true;
    }
    
    /**
     * Navigate to cart page
     */
    async goToCart() {
        await this.cartButton.click();
        await this.page.waitForLoadState('networkidle');
    }
    
    /**
     * Navigate to orders page
     */
    async goToOrders() {
        await this.orderButton.click();
        await this.page.waitForLoadState('networkidle');
    }
    
    /**
     * Sign out from the application
     */
    async signOut() {
        await this.signOutButton.click();
        await this.page.waitForLoadState('networkidle');
    }
}

module.exports = DashboardPage;
