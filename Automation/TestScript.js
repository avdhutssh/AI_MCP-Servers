
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const ExcelJS = require('exceljs');
const crypto = require('crypto');

// Configuration
const config = {
  baseUrl: 'https://rahulshettyacademy.com/client',
  outputDir: path.join(__dirname, 'output'),
  excelFile: 'newdata.xlsx', 
  database: {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '12345678',
    database: 'AppDB'
  },
  headless: false, // Set to true for headless mode
  slowMotion: 100 // Slow down actions by 100ms for visualization
};

// Utility functions
const utils = {
  // Generate a unique email with timestamp and random string
  generateUniqueEmail: (firstName, lastName) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '');
    const randomStr = crypto.randomBytes(3).toString('hex');
    return `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${timestamp}.${randomStr}@example.com`;
  },
  
  // Create output directory if it doesn't exist
  ensureOutputDir: () => {
    if (!fs.existsSync(config.outputDir)) {
      fs.mkdirSync(config.outputDir, { recursive: true });
    }
  },
  
  // Write data to Excel file
  writeToExcel: async (data) => {
    utils.ensureOutputDir();
    const filePath = path.join(config.outputDir, config.excelFile);
    
    const workbook = new ExcelJS.Workbook();
    let worksheet;
    
    // Check if file exists and create or load accordingly
    if (fs.existsSync(filePath)) {
      await workbook.xlsx.readFile(filePath);
      worksheet = workbook.getWorksheet('Credentials');
    } else {
      worksheet = workbook.addWorksheet('Credentials');
      worksheet.columns = [
        { header: 'Email', key: 'email', width: 50 },
        { header: 'Password', key: 'password', width: 20 },
        { header: 'Timestamp', key: 'timestamp', width: 25 }
      ];
    }
    
    // Add new row with current data
    worksheet.addRow({
      email: data.email,
      password: data.password,
      timestamp: new Date().toISOString()
    });
    
    // Save the workbook
    await workbook.xlsx.writeFile(filePath);
    console.log(`✅ Data saved to ${filePath}`);
    return filePath;
  },
  
  // Log with timestamp and optional color
  log: (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const colorCode = type === 'error' ? '\x1b[31m' : 
                      type === 'success' ? '\x1b[32m' : 
                      type === 'warn' ? '\x1b[33m' : '\x1b[0m';
    console.log(`${colorCode}[${timestamp}] ${message}\x1b[0m`);
  }
};

// Database service
class DatabaseService {
  constructor(config) {
    this.config = config;
    this.connection = null;
  }
  
  async connect() {
    try {
      this.connection = await mysql.createConnection(this.config);
      utils.log('📊 Database connection established', 'success');
      return true;
    } catch (error) {
      utils.log(`📊 Database connection failed: ${error.message}`, 'error');
      return false;
    }
  }
  
  async disconnect() {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
      utils.log('📊 Database connection closed', 'info');
    }
  }
  
  async fetchRandomRegistrationData() {
    try {
      // Try to fetch random user from database
      if (!this.connection) {
        throw new Error('Database connection not established');
      }
      
      // Get random user from registration details
      const [rows] = await this.connection.execute(
        'SELECT * FROM RegistrationDetails ORDER BY RAND() LIMIT 1'
      );
      
      if (rows.length === 0) {
        throw new Error('No records found in RegistrationDetails table');
      }
      
      const registrationData = rows[0];
      
      // Get email for this user if possible
      let email = null;
      try {
        const [emailRows] = await this.connection.execute(
          'SELECT email FROM UserNames WHERE id_number = ?',
          [registrationData.id_number]
        );
        
        if (emailRows.length > 0) {
          email = emailRows[0].email;
        }
      } catch (error) {
        utils.log(`Could not fetch email: ${error.message}`, 'warn');
      }
      
      return {
        firstName: registrationData.first_name,
        lastName: registrationData.last_name,
        phoneNumber: registrationData.phone_number?.replace(/\D/g, '') || null, // Remove non-digits
        occupation: registrationData.occupation,
        gender: registrationData.gender,
        is18OrOlder: registrationData.is_18_or_older === 1,
        baseEmail: email ? email.split('@')[0] : null
      };
    } catch (error) {
      utils.log(`📊 Error fetching registration data: ${error.message}`, 'error');
      // Return fallback data
      return {
        firstName: 'Alice',
        lastName: 'Brown',
        phoneNumber: '1112223333',
        occupation: 'Doctor',
        gender: 'Female',
        is18OrOlder: true,
        baseEmail: null
      };
    }
  }
}

// Registration and Login Manager
class RegistrationManager {
  constructor() {
    this.browser = null;
    this.page = null;
    this.db = new DatabaseService(config.database);
    this.credentials = {
      email: null,
      password: 'SecurePass123' // Default password
    };
  }
  
  async initialize() {
    // Launch browser
    this.browser = await chromium.launch({ 
      headless: config.headless,
      slowMo: config.slowMotion
    });
    
    this.page = await this.browser.newPage();
    
    // Connect to database if possible
    await this.db.connect().catch(() => {
      utils.log('Will use fallback data due to database connection failure', 'warn');
    });
    
    utils.log('🚀 Manager initialized', 'success');
  }
  
  async close() {
    await this.db.disconnect();
    
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    
    utils.log('🏁 Manager closed', 'info');
  }
  
  async navigateToRegistration() {
    utils.log('🌐 Navigating to registration page', 'info');
    
    await this.page.goto(config.baseUrl);
    await this.page.waitForLoadState('networkidle');
    
    // Click "Register here" link
    await this.page.locator('text=Register here').click();
    
    // Verify we're on the registration page
    await this.page.waitForSelector('h1:text("Register")');
    
    utils.log('🌐 Registration page loaded', 'success');
  }
  
  async fillRegistrationForm(userData) {
    utils.log('📝 Filling registration form', 'info');
    
    // Generate unique email
    const email = utils.generateUniqueEmail(userData.firstName, userData.lastName);
    this.credentials.email = email;
    
    // Fill form fields
    await this.page.locator('input[formcontrolname="firstName"]').fill(userData.firstName);
    await this.page.locator('input[formcontrolname="lastName"]').fill(userData.lastName);
    await this.page.locator('#userEmail').fill(email);
    await this.page.locator('input[formcontrolname="userMobile"]').fill(userData.phoneNumber);
    
    // Select occupation
    await this.page.locator('select[formcontrolname="occupation"]').selectOption(userData.occupation);
    
    // Select gender
    const genderSelector = userData.gender.toLowerCase() === 'female' ? 
      'input[value="Female"]' : 'input[value="Male"]';
    await this.page.locator(genderSelector).click();
    
    // Enter password
    await this.page.locator('input[formcontrolname="userPassword"]').fill(this.credentials.password);
    await this.page.locator('input[formcontrolname="confirmPassword"]').fill(this.credentials.password);
    
    // Check 18+ checkbox
    await this.page.locator('input[type="checkbox"]').click();
    
    utils.log('📝 Registration form filled', 'success');
  }
  
  async submitRegistration() {
    utils.log('🚀 Submitting registration', 'info');
    
    await this.page.locator('#login').click();
    
    try {
      // Wait for success message or error
      const successLocator = this.page.locator('h1:text("Account Created Successfully")');
      const errorLocator = this.page.locator('div.invalid-feedback, .error-message');
      
      const result = await Promise.race([
        successLocator.waitFor({ timeout: 10000 })
          .then(() => ({ success: true, message: 'Account created successfully' })),
        errorLocator.waitFor({ timeout: 10000 })
          .then(async () => {
            const errorText = await errorLocator.textContent();
            return { success: false, message: errorText || 'Registration failed' };
          })
      ]);
      
      if (result.success) {
        utils.log('✅ Registration successful', 'success');
        return true;
      } else {
        utils.log(`❌ Registration failed: ${result.message}`, 'error');
        return false;
      }
    } catch (error) {
      utils.log(`⚠️ Error during registration: ${error.message}`, 'error');
      return false;
    }
  }
  
  async apiLogin() {
    utils.log('🔑 Attempting API login', 'info');
    
    try {
      // Create the request payload
      const payload = {
        userEmail: this.credentials.email,
        userPassword: this.credentials.password
      };
      
      // Send the login request
      const loginResponse = await this.page.request.post(
        `${config.baseUrl.replace('/client', '')}/api/ecom/auth/login`, 
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
        utils.log('🔑 API Login successful', 'success');
        return {
          success: true,
          token: responseData.token,
          userId: responseData.userId
        };
      } else {
        utils.log(`❌ API Login failed: ${responseData.message || 'Unknown error'}`, 'error');
        return {
          success: false,
          message: responseData.message || 'Unknown error'
        };
      }
    } catch (error) {
      utils.log(`❌ API Login error: ${error.message}`, 'error');
      return {
        success: false,
        message: error.message
      };
    }
  }
  
  async saveCredentialsToExcel() {
    utils.log('💾 Saving credentials to Excel', 'info');
    
    try {
      const filePath = await utils.writeToExcel(this.credentials);
      utils.log(`💾 Credentials saved to: ${filePath}`, 'success');
      return true;
    } catch (error) {
      utils.log(`❌ Error saving credentials: ${error.message}`, 'error');
      return false;
    }
  }
  
  async completeRegistrationAndLogin() {
    try {
      // Initialize
      await this.initialize();
      
      // Get user data from DB or use fallback
      const userData = await this.db.fetchRandomRegistrationData();
      
      // Step 1: Navigate to registration page
      await this.navigateToRegistration();
      
      // Step 2: Fill registration form
      await this.fillRegistrationForm(userData);
      
      // Step 3: Submit registration
      const registrationSuccess = await this.submitRegistration();
      
      // Step 4: If registration successful, perform API login
      let loginResult = { success: false };
      if (registrationSuccess) {
        loginResult = await this.apiLogin();
      } else {
        utils.log('⚠️ Skipping login due to registration failure', 'warn');
      }
      
      // Step 5: If login successful, save credentials to Excel
      if (loginResult.success) {
        await this.saveCredentialsToExcel();
      }
      
      return {
        registrationSuccess,
        loginSuccess: loginResult.success,
        credentials: this.credentials
      };
    } catch (error) {
      utils.log(`❌ Error in completion process: ${error.message}`, 'error');
      
      return {
        registrationSuccess: false,
        loginSuccess: false,
        error: error.message
      };
    } finally {
      // Close browser and database connections
      await this.close();
    }
  }
}

// Main execution function
async function runAutomation() {
  utils.log('🤖 Starting automation process', 'info');
  
  const manager = new RegistrationManager();
  const result = await manager.completeRegistrationAndLogin();
  
  if (result.registrationSuccess && result.loginSuccess) {
    utils.log('✅ Automation completed successfully!', 'success');
    utils.log(`Email: ${result.credentials.email}`, 'info');
    utils.log(`Password: ${result.credentials.password}`, 'info');
  } else {
    utils.log('❌ Automation completed with errors', 'error');
  }
}

// Execute the automation
if (require.main === module) {
  runAutomation().catch(error => {
    utils.log(`❌ Fatal error: ${error.message}`, 'error');
    process.exit(1);
  });
}

// Export classes and functions for potential reuse
module.exports = {
  RegistrationManager,
  DatabaseService,
  utils,
  runAutomation
};