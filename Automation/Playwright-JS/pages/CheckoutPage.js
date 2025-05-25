// CheckoutPage.js
// Contains all checkout page related locators and actions

class CheckoutPage {
    constructor(page) {
        this.page = page;
        
        // Locators
        this.countryInput = this.page.locator('[placeholder="Select Country"]');
        this.countryDropdown = this.page.locator('.ta-results');
        this.countryOptions = this.page.locator('.ta-item');
        this.placeOrderButton = this.page.locator('.action__submit');
        this.cvvInput = this.page.locator('input[type="text"].input.txt');
        this.nameOnCardInput = this.page.locator('div.field input.input.text:has(input[type="text"].mt-1)').nth(0);
        this.couponInput = this.page.locator('input[name="coupon"]');
        this.applyCouponButton = this.page.locator('button:has-text("Apply Coupon")');
        this.orderConfirmationMessage = this.page.locator('.hero-primary');
        this.orderID = this.page.locator('label[class="ng-star-inserted"]');
    }
    
    /**
     * Select country from dropdown
     * @param {string} countryName - Country name to select
     */
    async selectCountry(countryName) {
        await this.countryInput.fill(countryName.substring(0, 3));
        await this.page.waitForSelector('.ta-results');
        await this.countryOptions.locator('text=${countryName}').click();
    }
    
    /**
     * Enter payment details
     * @param {Object} paymentDetails - Payment details
     * @param {string} paymentDetails.cvv - CVV number
     * @param {string} paymentDetails.nameOnCard - Name on card
     */
    async enterPaymentDetails(paymentDetails) {
        if (paymentDetails.cvv) {
            await this.cvvInput.fill(paymentDetails.cvv);
        }
        
        if (paymentDetails.nameOnCard) {
            await this.nameOnCardInput.fill(paymentDetails.nameOnCard);
        }
    }
    
    /**
     * Apply coupon code
     * @param {string} couponCode - Coupon code to apply
     */
    async applyCoupon(couponCode) {
        await this.couponInput.fill(couponCode);
        await this.applyCouponButton.click();
        await this.page.waitForLoadState('networkidle');
    }
    
    /**
     * Place order
     */
    async placeOrder() {
        await this.placeOrderButton.click();
        await this.page.waitForLoadState('networkidle');
    }
    
    /**
     * Get order confirmation message
     * @returns {Promise<string>} Confirmation message
     */
    async getConfirmationMessage() {
        return await this.orderConfirmationMessage.textContent();
    }
    
    /**
     * Get order ID
     * @returns {Promise<string>} Order ID
     */
    async getOrderID() {
        const text = await this.orderID.textContent();
        // Extract order ID from text like "Order ID: 12345"
        return text.split('|')[0].trim();
    }
    
    /**
     * Verify order is placed successfully
     * @returns {Promise<boolean>} True if order is placed successfully
     */
    async isOrderPlacedSuccessfully() {
        const message = await this.getConfirmationMessage();
        return message.includes('Thankyou for the order') || message.includes('Thank you for the order');
    }
}

module.exports = CheckoutPage;
