// CartPage.js
// Contains all cart page related locators and actions

class CartPage {
    constructor(page) {
        this.page = page;
        
        // Locators
        this.cartItems = this.page.locator('div.cartSection h3');
        this.productPrices = this.page.locator('div.prodTotal p');
        this.totalAmount = this.page.locator('div.totalRow span.text-info');
        this.checkoutButton = this.page.locator('button:has-text("Checkout")');
        this.removeButtons = this.page.locator('button.btn-danger');
    }
    
    /**
     * Get list of cart items
     * @returns {Promise<Array<string>>} List of product names in cart
     */
    async getCartItems() {
        return await this.cartItems.allTextContents();
    }
    
    /**
     * Get cart total amount
     * @returns {Promise<string>} Total amount
     */
    async getTotalAmount() {
        return await this.totalAmount.textContent();
    }
    
    /**
     * Verify if product is in cart
     * @param {string} productName - Product name to check
     * @returns {Promise<boolean>} True if product is in cart
     */
    async isProductInCart(productName) {
        const items = await this.getCartItems();
        return items.some(item => item.includes(productName));
    }
    
    /**
     * Remove product from cart by name
     * @param {string} productName - Product name to remove
     * @returns {Promise<boolean>} True if product was removed
     */
    async removeProduct(productName) {
        const items = await this.cartItems.all();
        
        for (let i = 0; i < items.length; i++) {
            const name = await items[i].textContent();
            
            if (name.includes(productName)) {
                await this.removeButtons.nth(i).click();
                await this.page.waitForLoadState('networkidle');
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Proceed to checkout
     */
    async proceedToCheckout() {
        await this.checkoutButton.click();
        await this.page.waitForLoadState('networkidle');
    }
    
    /**
     * Get cart item count
     * @returns {Promise<number>} Number of items in cart
     */
    async getCartItemCount() {
        return await this.cartItems.count();
    }
}

module.exports = CartPage;
