// ProductDetailsPage.js
// Contains all product details page related locators and actions

class ProductDetailsPage {
    constructor(page) {
        this.page = page;
        
        // Locators
        this.productTitle = this.page.locator('.product-title');
        this.productPrice = this.page.locator('.product-price');
        this.productDescription = this.page.locator('.product-details p');
        this.addToCartButton = this.page.locator('button:has-text("Add To Cart")');
        this.viewCartButton = this.page.locator('button[routerlink*="cart"]');
        this.productImages = this.page.locator('.image-gallery img');
        this.quantityInput = this.page.locator('select.quantity');
    }
    
    /**
     * Get product title
     * @returns {Promise<string>} Product title
     */
    async getProductTitle() {
        return await this.productTitle.textContent();
    }
    
    /**
     * Get product price
     * @returns {Promise<string>} Product price
     */
    async getProductPrice() {
        return await this.productPrice.textContent();
    }
    
    /**
     * Get product description
     * @returns {Promise<string>} Product description
     */
    async getProductDescription() {
        return await this.productDescription.textContent();
    }
    
    /**
     * Add product to cart
     */
    async addToCart() {
        await this.addToCartButton.click();
        // Wait for toast or some confirmation
        await this.page.waitForLoadState('networkidle');
    }
    
    /**
     * View cart
     */
    async viewCart() {
        await this.viewCartButton.click();
        await this.page.waitForLoadState('networkidle');
    }
    
    /**
     * Select quantity
     * @param {string|number} quantity - Quantity to select
     */
    async selectQuantity(quantity) {
        await this.quantityInput.selectOption(quantity.toString());
    }
    
    /**
     * Get image count
     * @returns {Promise<number>} Number of product images
     */
    async getImageCount() {
        return await this.productImages.count();
    }
}

module.exports = ProductDetailsPage;
