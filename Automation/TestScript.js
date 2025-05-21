// TestScriptWithAllure.js

const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const ExcelJS = require('exceljs');
const crypto = require('crypto');
const allure = require('allure-commandline');

// Configuration
const config = {
  baseUrl: 'https://rahulshettyacademy.com/client',
  outputDir: path.join(__dirname, 'output'),
  excelFile: 'newdata.xlsx',
  allureResultsDir: path.join(__dirname, 'allure-results'),
  allureReportDir: path.join(__dirname, 'allure-report'),
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
  logs: [], // Store logs for reporting
  
  log: (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const colorCode = type === 'error' ? '\x1b[31m' : 
                      type === 'success' ? '\x1b[32m' : 
                      type === 'warn' ? '\x1b[33m' : '\x1b[0m';
    console.log(`${colorCode}[${timestamp}] ${message}\x1b[0m`);
    
    // Store log for report
    utils.logs.push({
      timestamp,
      message,
      type
    });
  },
  
  // Allure reporting utility
  allure: {
    startStep: (name) => {
      // Create simple step record
      return {
        name: name,
        startTime: Date.now(),
        status: 'passed'
      };
    },
    
    endStep: (step, status = 'passed') => {
      step.status = status;
      step.endTime = Date.now();
      return step;
    },
    
    // Create JSON for Allure consumption
    writeResults: (testData) => {
      // Ensure directory exists
      if (!fs.existsSync(config.allureResultsDir)) {
        fs.mkdirSync(config.allureResultsDir, { recursive: true });
      }
      
      const uuid = crypto.randomBytes(16).toString('hex');
      
      // Convert logs to steps if no steps were explicitly created
      const logSteps = utils.logs.map(log => ({
        name: log.message,
        status: log.type === 'error' ? 'failed' : 
                log.type === 'warn' ? 'broken' : 'passed',
        stage: 'finished',
        start: new Date(`1/1/2023 ${log.timestamp}`).getTime(),
        stop: new Date(`1/1/2023 ${log.timestamp}`).getTime() + 1 // Add 1ms to ensure valid range
      }));
      
      const steps = testData.steps.length > 0 ? testData.steps : logSteps;
      
      // Create Allure test result JSON structure
      const result = {
        uuid: uuid,
        historyId: crypto.createHash('md5').update('rahul-shetty-test').digest('hex'),
        name: 'Rahul Shetty Academy Registration & Login Test',
        fullName: 'Registration and Login Automation',
        status: testData.success ? 'passed' : 'failed',
        stage: 'finished',
        start: testData.startTime,
        stop: Date.now(),
        labels: [
          { name: 'suite', value: 'Registration Tests' },
          { name: 'feature', value: 'User Registration' },
          { name: 'story', value: 'New User Registration' },
          { name: 'severity', value: 'critical' }
        ],
        steps: steps,
        attachments: testData.attachments || [],
        parameters: [],
        description: {
          type: 'markdown',
          value: `
# Registration Test
This test verifies that a new user can be registered and logged in via the API.

## Test Steps:
1. Navigate to registration page
2. Fill in user details
3. Submit registration
4. Verify API login
5. Save credentials
          `
        }
      };
      
      if (!testData.success && testData.error) {
        result.statusDetails = {
          message: testData.error,
          trace: testData.error
        };
        
        result.extra = {
          categories: [{
            name: 'Registration issues',
            matchedStatuses: ['failed', 'broken']
          }]
        };
      }
      
      // Save Allure result JSON
      fs.writeFileSync(
        path.join(config.allureResultsDir, `${uuid}-result.json`),
        JSON.stringify(result)
      );
      
      // Create categories.json
      const categories = [
        {
          name: 'Registration issues',
          matchedStatuses: ['failed', 'broken'],
          messageRegex: '.*registration.*'
        },
        {
          name: 'Login API issues',
          matchedStatuses: ['failed', 'broken'],
          messageRegex: '.*login.*|.*API.*'
        },
        {
          name: 'Database issues',
          matchedStatuses: ['failed', 'broken'],
          messageRegex: '.*database.*|.*SQL.*'
        }
      ];
      
      fs.writeFileSync(
        path.join(config.allureResultsDir, 'categories.json'),
        JSON.stringify(categories)
      );
      
      // Create environment properties file
      const envData = {
        'Browser': 'Chromium',
        'Browser.Version': 'latest',
        'URL': config.baseUrl,
        'Test.Environment': 'Local',
        'Timestamp': new Date().toISOString()
      };
      
      const envProperties = Object.entries(envData)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
      
      fs.writeFileSync(
        path.join(config.allureResultsDir, 'environment.properties'),
        envProperties
      );
      
      // Create executor.json
      const executor = {
        name: 'Playwright',
        type: 'playwright',
        buildName: 'Avdhut Automation Build'
      };
      
      fs.writeFileSync(
        path.join(config.allureResultsDir, 'executor.json'),
        JSON.stringify(executor)
      );
      
      utils.log(`📊 Allure results written to: ${config.allureResultsDir}`, 'success');
    },
    
    // Helper to convert a screenshot to Allure attachment
    createScreenshotAttachment: (name, buffer) => {
      const fileName = `${crypto.randomBytes(8).toString('hex')}-screenshot.png`;
      
      // Ensure directory exists
      if (!fs.existsSync(config.allureResultsDir)) {
        fs.mkdirSync(config.allureResultsDir, { recursive: true });
      }
      
      // Write screenshot file
      fs.writeFileSync(path.join(config.allureResultsDir, fileName), buffer);
      
      // Return attachment metadata
      return {
        name: name,
        source: fileName,
        type: 'image/png'
      };
    },
    
    // Generate Allure report from results
    generateReport: async () => {
      utils.log('📊 Generating Allure report...', 'info');
      
      return new Promise((resolve) => {
        const generation = allure([
          'generate',
          config.allureResultsDir,
          '-o',
          config.allureReportDir,
          '--clean'
        ]);
        
        generation.on('exit', code => {
          if (code === 0) {
            utils.log(`📊 Allure report generated at: ${config.allureReportDir}`, 'success');
          } else {
            utils.log(`❌ Allure report generation failed with code: ${code}`, 'error');
          }
          resolve(code === 0);
        });
      });
    },
    
    // Open Allure report
    openReport: async () => {
      utils.log('📊 Opening Allure report...', 'info');
      
      return new Promise((resolve) => {
        const open = allure(['open', config.allureReportDir]);
        
        open.on('exit', code => {
          resolve(code === 0);
        });
      });
    }
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
    
    // Test data for Allure reporting
    this.testData = {
      startTime: Date.now(),
      steps: [],
      attachments: [],
      success: false,
      error: null
    };
  }
  
  async _captureScreenshot(name) {
    const screenshot = await this.page.screenshot();
    const attachment = utils.allure.createScreenshotAttachment(name, screenshot);
    this.testData.attachments.push(attachment);
    return attachment;
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
    let step = utils.allure.startStep('Navigate to registration page');
    utils.log('🌐 Navigating to registration page', 'info');
    
    try {
      await this.page.goto(config.baseUrl);
      await this.page.waitForLoadState('networkidle');
      
      // Capture screenshot
      await this._captureScreenshot('Login Page');
      
      // Click "Register here" link
      await this.page.locator('text=Register here').click();
      
      // Verify we're on the registration page
      await this.page.waitForSelector('h1:text("Register")');
      
      // Capture screenshot
      await this._captureScreenshot('Registration Page');
      
      utils.log('🌐 Registration page loaded', 'success');
      utils.allure.endStep(step);
    } catch (error) {
      utils.log(`❌ Navigation failed: ${error.message}`, 'error');
      utils.allure.endStep(step, 'failed');
      throw error;
    }
    
    this.testData.steps.push(step);
  }
  
  async fillRegistrationForm(userData) {
    let step = utils.allure.startStep('Fill registration form');
    utils.log('📝 Filling registration form', 'info');
    
    try {
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
      
      // Capture screenshot
      await this._captureScreenshot('Filled Registration Form');
      
      utils.log('📝 Registration form filled', 'success');
      utils.allure.endStep(step);
    } catch (error) {
      utils.log(`❌ Form filling failed: ${error.message}`, 'error');
      utils.allure.endStep(step, 'failed');
      throw error;
    }
    
    this.testData.steps.push(step);
  }
  
  async submitRegistration() {
    let step = utils.allure.startStep('Submit registration');
    utils.log('🚀 Submitting registration', 'info');
    
    try {
      await this.page.locator('#login').click();
      
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
      ]).catch(() => ({ success: false, message: 'Timeout waiting for registration response' }));
      
      // Capture screenshot
      await this._captureScreenshot('Registration Result');
      
      if (result.success) {
        utils.log('✅ Registration successful', 'success');
        utils.allure.endStep(step);
        return true;
      } else {
        utils.log(`❌ Registration failed: ${result.message}`, 'error');
        utils.allure.endStep(step, 'failed');
        return false;
      }
    } catch (error) {
      utils.log(`⚠️ Error during registration: ${error.message}`, 'error');
      utils.allure.endStep(step, 'broken');
      return false;
    } finally {
      this.testData.steps.push(step);
    }
  }
  
  async apiLogin() {
    let step = utils.allure.startStep('API Login');
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
        utils.allure.endStep(step);
        return {
          success: true,
          token: responseData.token,
          userId: responseData.userId
        };
      } else {
        utils.log(`❌ API Login failed: ${responseData.message || 'Unknown error'}`, 'error');
        utils.allure.endStep(step, 'failed');
        return {
          success: false,
          message: responseData.message || 'Unknown error'
        };
      }
    } catch (error) {
      utils.log(`❌ API Login error: ${error.message}`, 'error');
      utils.allure.endStep(step, 'broken');
      return {
        success: false,
        message: error.message
      };
    } finally {
      this.testData.steps.push(step);
    }
  }
  
  async saveCredentialsToExcel() {
    let step = utils.allure.startStep('Save credentials to Excel');
    utils.log('💾 Saving credentials to Excel', 'info');
    
    try {
      const filePath = await utils.writeToExcel(this.credentials);
      utils.log(`💾 Credentials saved to: ${filePath}`, 'success');
      utils.allure.endStep(step);
      return true;
    } catch (error) {
      utils.log(`❌ Error saving credentials: ${error.message}`, 'error');
      utils.allure.endStep(step, 'failed');
      return false;
    } finally {
      this.testData.steps.push(step);
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
      let excelSaved = false;
      if (loginResult.success) {
        excelSaved = await this.saveCredentialsToExcel();
      }
      
      // Prepare results for allure
      this.testData.success = registrationSuccess && loginResult.success;
      
      // Write Allure results
      utils.allure.writeResults(this.testData);
      
      // Generate Allure report
      await utils.allure.generateReport();
      
      return {
        registrationSuccess,
        loginSuccess: loginResult.success,
        credentials: this.credentials,
        excelSaved
      };
    } catch (error) {
      utils.log(`❌ Error in completion process: ${error.message}`, 'error');
      
      this.testData.success = false;
      this.testData.error = error.message;
      
      // Write Allure results even for failures
      utils.allure.writeResults(this.testData);
      await utils.allure.generateReport();
      
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
    
    // Open Allure report
    await utils.allure.openReport().catch(() => {
      utils.log('Could not automatically open report. Run "npx allure open allure-report" manually.', 'warn');
    });
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