// RegistrationPage.js
// Contains all registration page related locators and actions

class RegistrationPage {
    constructor(page) {
        this.page = page;
        
        // Locators
        this.firstNameInput = this.page.locator('input[formcontrolname="firstName"]');
        this.lastNameInput = this.page.locator('input[formcontrolname="lastName"]');
        this.emailInput = this.page.locator('#userEmail');
        this.phoneInput = this.page.locator('input[formcontrolname="userMobile"]');
        this.occupationSelect = this.page.locator('select[formcontrolname="occupation"]');
        this.femaleGenderRadio = this.page.locator('input[value="Female"]');
        this.maleGenderRadio = this.page.locator('input[value="Male"]');
        this.passwordInput = this.page.locator('input[formcontrolname="userPassword"]');
        this.confirmPasswordInput = this.page.locator('input[formcontrolname="confirmPassword"]');
        this.ageCheckbox = this.page.locator('input[type="checkbox"]');
        this.registerButton = this.page.locator('#login');
        this.successMessage = this.page.locator('h1:text("Account Created Successfully")');
        this.errorMessage = this.page.locator('div.invalid-feedback, .error-message');
    }
    
    /**
     * Fill registration form with user data
     * @param {Object} userData - User registration data
     * @param {string} userData.firstName - First name
     * @param {string} userData.lastName - Last name
     * @param {string} userData.email - Email address
     * @param {string} userData.phoneNumber - Phone number
     * @param {string} userData.occupation - Occupation
     * @param {string} userData.gender - Gender (Male/Female)
     * @param {string} userData.password - Password
     * @param {boolean} userData.is18OrOlder - Age verification
     */
    async fillRegistrationForm(userData) {
        await this.firstNameInput.fill(userData.firstName);
        await this.lastNameInput.fill(userData.lastName);
        await this.emailInput.fill(userData.email);
        await this.phoneInput.fill(userData.phoneNumber);
        
        // Handle occupation dropdown
        await this.page.evaluate((occupation) => {
            const select = document.querySelector('select[formcontrolname="occupation"]');
            if (select) {
                select.value = occupation;
                select.dispatchEvent(new Event('change'));
            }
        }, userData.occupation);
        
        // Select gender
        if (userData.gender.toLowerCase() === 'female') {
            await this.femaleGenderRadio.click();
        } else {
            await this.maleGenderRadio.click();
        }
        
        // Fill password fields
        await this.passwordInput.fill(userData.password);
        await this.confirmPasswordInput.fill(userData.password);
        
        // Check age verification if needed
        if (userData.is18OrOlder) {
            await this.ageCheckbox.click();
        }
    }
    
    /**
     * Submit registration form
     * @returns {Promise<{success: boolean, message: string}>} Result of registration
     */
    async submitRegistration() {
        await this.registerButton.click();
        
        try {
            // Wait for success message or error
            const result = await Promise.race([
                this.successMessage.waitFor({ timeout: 10000 })
                    .then(() => ({ success: true, message: 'Account created successfully' })),
                this.errorMessage.waitFor({ timeout: 10000 })
                    .then(async () => {
                        const errorText = await this.errorMessage.textContent();
                        return { success: false, message: errorText || 'Registration failed' };
                    })
            ]).catch(() => ({ success: false, message: 'Timeout waiting for registration response' }));
            
            return result;
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
    
    /**
     * Check if registration was successful
     * @returns {Promise<boolean>} True if registration was successful
     */
    async isRegistrationSuccessful() {
        return await this.successMessage.isVisible();
    }
}

module.exports = RegistrationPage;
