// AllureReporter.js
// Allure reporting utility for the automation framework

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const allure = require('allure-commandline');
const { log, getLogs } = require('../logger/Logger');
const config = require('../../config/config');

/**
 * Allure reporting utility
 */
class AllureReporter {
    constructor() {
        this.testData = {
            startTime: Date.now(),
            steps: [],
            attachments: [],
            success: false,
            error: null,
            apiData: []
        };
    }

    /**
     * Clean results directory before run
     */
    cleanResultsDirectory() {
        if (fs.existsSync(config.allureResultsDir)) {
            fs.rmSync(config.allureResultsDir, { recursive: true, force: true });
        }
        fs.mkdirSync(config.allureResultsDir, { recursive: true });
        log('Cleaned Allure results directory', 'info');
    }
    
    /**
     * Start a new test step
     * @param {string} name - Step name
     * @returns {Object} Step object
     */
    startStep(name) {
        // Create simple step record
        return {
            name: name,
            startTime: Date.now(),
            status: 'passed'
        };
    }
    
    /**
     * End a test step
     * @param {Object} step - Step object
     * @param {string} status - Step status (passed, failed, broken)
     * @returns {Object} Updated step object
     */
    endStep(step, status = 'passed') {
        step.status = status;
        step.endTime = Date.now();
        this.testData.steps.push(step);
        return step;
    }
    
    /**
     * Create a screenshot attachment
     * @param {string} name - Screenshot name
     * @param {Buffer} buffer - Screenshot buffer
     * @returns {Object} Attachment metadata
     */
    createScreenshotAttachment(name, buffer) {
        const fileName = `${crypto.randomBytes(8).toString('hex')}-screenshot.png`;
        
        // Ensure directory exists
        if (!fs.existsSync(config.allureResultsDir)) {
            fs.mkdirSync(config.allureResultsDir, { recursive: true });
        }
        
        // Write screenshot file
        fs.writeFileSync(path.join(config.allureResultsDir, fileName), buffer);
        
        // Return attachment metadata
        const attachment = {
            name: name,
            source: fileName,
            type: 'image/png'
        };
        
        this.testData.attachments.push(attachment);
        return attachment;
    }
      /**
     * Write test results to Allure JSON files
     * @param {Object} testInfo - Additional test information
     * @param {string} testInfo.name - Test name
     * @param {string} testInfo.fullName - Full test name
     * @param {string} testInfo.description - Test description
     * @param {string[]} testInfo.tags - Test tags (smoke, critical, regression, etc.)
     * @param {Object[]} testInfo.apiData - API request/response data
     */
    writeResults(testInfo = {}) {
        // Ensure directory exists
        if (!fs.existsSync(config.allureResultsDir)) {
            fs.mkdirSync(config.allureResultsDir, { recursive: true });
        }
        
        const uuid = crypto.randomBytes(16).toString('hex');
        
        // Convert logs to steps if no steps were explicitly created
        const logSteps = getLogs().map(log => ({
            name: log.message,
            status: log.type === 'error' ? 'failed' : 
                    log.type === 'warn' ? 'broken' : 'passed',
            stage: 'finished',
            start: new Date('1/1/2023 ${log.timestamp}').getTime(),
            stop: new Date('1/1/2023 ${log.timestamp}').getTime() + 1 // Add 1ms to ensure valid range
        }));
        
        const steps = this.testData.steps.length > 0 ? this.testData.steps : logSteps;
        
        // Process API data if present
        let apiDataMarkdown = '';
        if (testInfo.apiData && testInfo.apiData.length > 0) {
            apiDataMarkdown = '\n\n## API Calls\n';
            testInfo.apiData.forEach((apiCall, index) => {
                apiDataMarkdown += `\n### API Call ${index + 1}: ${apiCall.endpoint || 'Unknown Endpoint'}\n`;
                apiDataMarkdown += `**Method:** ${apiCall.method || 'GET'}\n`;
                
                if (apiCall.request) {
                    apiDataMarkdown += "\n**Request:**\n'''json\n";
                    apiDataMarkdown += JSON.stringify(apiCall.request, null, 2);
                    apiDataMarkdown += "\n'''\n";
                }
                
                if (apiCall.response) {
                    apiDataMarkdown += "\n**Response:**\n'''json\n";
                    apiDataMarkdown += JSON.stringify(apiCall.response, null, 2);
                    apiDataMarkdown += "\n'''\n";
                }
                
                if (apiCall.status) {
                    apiDataMarkdown += '\n**Status:** ${apiCall.status}\n';
                }
            });
        }
        
        // Process tags for labels
        const labels = [
            { name: 'suite', value: testInfo.suite || 'UI Tests' },
            { name: 'feature', value: testInfo.feature || 'User Interface' },
            { name: 'story', value: testInfo.story || testInfo.name || 'Test Execution' },
            { name: 'severity', value: testInfo.severity || 'normal' }
        ];
        
        // Add tags as labels
        if (testInfo.tags && Array.isArray(testInfo.tags)) {
            testInfo.tags.forEach(tag => {
                labels.push({ name: 'tag', value: tag });
            });
        }
        
        // Create Allure test result JSON structure
        const result = {
            uuid: uuid,
            historyId: crypto.createHash('md5').update(testInfo.name || 'avdhut-test').digest('hex'),
            name: testInfo.name || 'Avdhut Build - Registration & Login Test',
            fullName: testInfo.fullName || 'Avdhut Build - Registration and Login Automation',
            status: this.testData.success ? 'passed' : 'failed',
            stage: 'finished',
            start: this.testData.startTime,
            stop: Date.now(),
            labels: labels,
            steps: steps,
            attachments: this.testData.attachments || [],
            parameters: [],
description: (testInfo.description || `# ${testInfo.name || 'Test Execution'}
This test verifies application functionality.

## Test Steps:
1. Navigate to application
2. Perform test actions
3. Verify results`) + apiDataMarkdown
        };
        
        if (!this.testData.success && this.testData.error) {
            result.statusDetails = {
                message: this.testData.error,
                trace: this.testData.error
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
            JSON.stringify(result, null, 2)
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
            JSON.stringify(categories, null, 2)
        );
        
        // Create environment properties file
        const envData = {
            'Browser': 'Chromium',
            'Browser.Version': 'latest',
            'URL': config.baseUrl,
            'Test.Environment': 'Local',
            'Build': 'Avdhut Build',
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
            buildName: 'Avdhut Build'
        };
        
        fs.writeFileSync(
            path.join(config.allureResultsDir, 'executor.json'),
            JSON.stringify(executor, null, 2)
        );
        
        log('Allure results written to: ${config.allureResultsDir}', 'success');
    }
    
    /**
     * Generate Allure report from results
     * @returns {Promise<boolean>} True if report generation was successful
     */
    async generateReport() {
        log('Generating Allure report...', 'info');
        
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
                    log('Allure report generated at: ${config.allureReportDir}', 'success');
                } else {
                    log('Allure report generation failed with code: ${code}', 'error');
                }
                resolve(code === 0);
            });
        });
    }
    
    /**
     * Open Allure report
     * @returns {Promise<boolean>} True if report opening was successful
     */
    async openReport() {
        log('Opening Allure report...', 'info');
        
        return new Promise((resolve) => {
            const open = allure(['open', config.allureReportDir]);
            
            open.on('exit', code => {
                resolve(code === 0);
            });
        });
    }
    
    /**
     * Set test as successful
     */
    setSuccess() {
        this.testData.success = true;
    }
    
    /**
     * Set test as failed
     * @param {string} error - Error message
     */    setFailure(error) {
        this.testData.success = false;
        this.testData.error = error;
    }
    
    /**
     * Record API call information for reporting
     * @param {Object} apiData - API call data
     * @param {string} apiData.endpoint - API endpoint
     * @param {string} apiData.method - HTTP method
     * @param {Object} apiData.request - Request payload
     * @param {Object} apiData.response - Response data
     * @param {number|string} apiData.status - Response status
     */
    recordApiCall(apiData) {
        this.testData.apiData.push(apiData);
        log('Recorded API call to ${apiData.endpoint}', 'info');
    }
}

module.exports = new AllureReporter();
