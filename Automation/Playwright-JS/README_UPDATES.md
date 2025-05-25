# Playwright Automation Framework - Updates

## Recent Fixes

### 1. Fixed API Tests in Browserless Mode
- Modified `ApiBaseTest.js` to initialize API client without requiring a Playwright page object
- Updated `ApiClient.js` to work correctly with or without a browser page

### 2. Fixed Template Literals
- Corrected syntax errors where single quotes were incorrectly used instead of backticks
- Added automated script `fixRemainingTemplates.js` to find and fix all template literal syntax issues
- All template literal expressions now use proper backtick syntax (`\`${variable}\``)

### 3. Fixed Test Data Handling
- Updated all test classes to accept test data in their constructors
- Test data is now properly passed from test runner to test instances
- Created `TestDataProcessor.js` to prepare default test data (like credentials)
- Modified `runTests.js` to use the default test data and merge it with specific test data

## Using the Framework

### Running Tests
Tests can be run using the following commands:
```bash
# Run all tests
node runTests.js --all

# Run tests with a specific tag
node runTests.js --tag smoke

# Run a specific test
node runTests.js --test login

# Run multiple specific tests
node runTests.js --tests login productCatalog
```

### Test Data Management
Test data is loaded and passed to test instances automatically. Tests should use this approach to access data:

```javascript
// First check if data is in test data
if (this.testData && this.testData.userCredentials) {
    // Use data from test data
    this.credentials = this.testData.userCredentials;
} else {
    // Fall back to alternative source
    // ...
}
```

### API Tests
API tests can now run in browserless mode. The `ApiClient` class automatically handles requests without requiring a Playwright page object.

### Reporting
All tests generate Allure reports. View the reports using:
```bash
npm run report
```
