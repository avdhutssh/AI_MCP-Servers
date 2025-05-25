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
        
        // Filter locators
        this.priceSlider = this.page.locator('.ng5-slider');
        this.categoryCheckboxes = this.page.locator('.form-check-input[type="checkbox"]');
        this.brandRadioButtons = this.page.locator('.form-check-input[type="radio"]');
        this.clearFilterButton = this.page.locator('button:has-text("Clear")');
        this.ratingStars = this.page.locator('.star');
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
     */    async signOut() {
        await this.signOutButton.click();
        await this.page.waitForLoadState('networkidle');
    }

    /**
     * Navigate to dashboard page
     * @param {string} baseUrl - Base URL of the application
     */
    async navigate(baseUrl) {
        await this.page.goto(baseUrl);
        await this.page.waitForLoadState('networkidle');
    }
    
    /**
     * Apply price filter
     * @param {number} minPrice - Minimum price
     * @param {number} maxPrice - Maximum price
     */
    async applyPriceFilter(minPrice, maxPrice) {
        // Price slider handling is complex and might require custom implementation
        // For demonstration purposes, we'll use a simplified version
        await this.page.locator('.min-price-input').fill(minPrice.toString());
        await this.page.locator('.max-price-input').fill(maxPrice.toString());
        await this.page.locator('button:has-text("Apply")').click();
    }
    
    /**
     * Apply category filter
     * @param {string} category - Category name
     */
    async applyCategoryFilter(category) {
        const categoryCheckbox = this.page.locator('.form-check-label:text-is("${category}")')
            .locator('..').locator('input[type="checkbox"]');
        await categoryCheckbox.check();
    }
    
    /**
     * Apply brand filter
     * @param {string} brand - Brand name
     */
    async applyBrandFilter(brand) {
        const brandRadio = this.page.locator('.form-check-label:text-is("${brand}")')
            .locator('..').locator('input[type="radio"]');
        await brandRadio.check();
    }
    
    /**
     * Apply rating filter
     * @param {number} rating - Minimum rating (1-5)
     */
    async applyRatingFilter(rating) {
        const ratingSelector = this.page.locator('.ratings .star:nth-child(${rating})');
        await ratingSelector.click();
    }
    
    /**
     * Clear all filters
     */
    async clearFilters() {
        await this.clearFilterButton.click();
    }
    
    /**
     * Get product prices
     * @returns {Promise<number[]>} List of product prices
     */
    async getProductPrices() {
        const count = await this.productCards.count();
        const prices = [];
        
        for (let i = 0; i < count; i++) {
            const card = this.productCards.nth(i);
            const priceText = await card.locator('.product-price').textContent();
            const price = parseFloat(priceText.replace(/[^\d.]/g, ''));
            prices.push(price);
        }
        
        return prices;
    }
    
    /**
     * Get product categories
     * @returns {Promise<string[]>} List of product categories
     */
    async getProductCategories() {
        const count = await this.productCards.count();
        const categories = [];
        
        for (let i = 0; i < count; i++) {
            const card = this.productCards.nth(i);
            const category = await card.locator('.product-category').textContent();
            categories.push(category);
        }
        
        return categories;
    }
    
    /**
     * Get product brands
     * @returns {Promise<string[]>} List of product brands
     */
    async getProductBrands() {
        const count = await this.productCards.count();
        const brands = [];
        
        for (let i = 0; i < count; i++) {
            const card = this.productCards.nth(i);
            const brand = await card.locator('.product-brand').textContent();
            brands.push(brand);
        }
        
        return brands;
    }
    
    /**
     * Get the number of products displayed
     * @returns {Promise<number>} Number of products
     */    async getProductCount() {
        return await this.productCards.count();
    }
}

module.exports = DashboardPage;
