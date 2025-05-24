// LoginPage.js
// Contains all login page related locators and actions

class LoginPage {
    constructor(page) {
        this.page = page;
        
        // Locators
        this.emailInput = this.page.locator('#userEmail');
        this.passwordInput = this.page.locator('input[formcontrolname="userPassword"]');
        this.loginButton = this.page.locator('#login');
        this.registerLink = this.page.locator('text=Register here');
        this.forgotPasswordLink = this.page.locator('text=Forgot password?');
    }
    
    /**
     * Navigate to login page
     * @param {string} baseUrl - Base URL of the application
     */
    async navigate(baseUrl) {
        await this.page.goto(baseUrl);
        await this.page.waitForLoadState('networkidle');
    }
    
    /**
     * Fill login form and submit
     * @param {string} email - User email
     * @param {string} password - User password
     */
    async login(email, password) {
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
    }
    
    /**
     * Click on register link to navigate to registration page
     */
    async goToRegistration() {
        await this.registerLink.click();
        // Wait for registration page to load
        await this.page.waitForSelector('h1:text("Register")');
    }
    
    /**
     * Click on forgot password link
     */
    async goToForgotPassword() {
        await this.forgotPasswordLink.click();
    }
}

module.exports = LoginPage;
