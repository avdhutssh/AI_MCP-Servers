# Playwright Automation Framework

A well-structured Playwright automation framework using the Page Object Model (POM) pattern.

## Framework Structure

```
Playwright-JS/
├── config/
│   └── config.js                # Configuration settings
├── data/
│   ├── excel/                   # Excel test data files
│   └── json/                    # JSON test data files
├── pages/
│   ├── LoginPage.js             # Login page object
│   ├── RegistrationPage.js      # Registration page object
│   └── DashboardPage.js         # Dashboard page object
├── reports/                     # Test reports
├── tests/
│   ├── BaseTest.js              # Base test class
│   ├── api/
│   │   └── LoginApiTest.js      # API login test
│   └── ui/
│       └── RegistrationTest.js  # Registration UI test
├── utils/
│   ├── api/
│   │   └── ApiClient.js         # API client for API testing
│   ├── database/
│   │   └── DatabaseService.js   # Database service
│   ├── helpers/
│   │   └── Utils.js             # Utility functions
│   ├── logger/
│   │   └── Logger.js            # Logging functionality
│   └── reporter/
│       └── AllureReporter.js    # Allure reporting utilities
└── package.json                 # Project dependencies
```

## Features

- **Page Object Model (POM)**: Separates page elements and actions from test logic
- **Allure Reporting**: Detailed test reports with screenshots and steps
- **API Testing**: API client for backend testing
- **Database Integration**: MySQL database connectivity
- **Excel Integration**: Read/write test data from Excel
- **Logging**: Comprehensive logging system
- **Configuration**: Centralized configuration management

## Prerequisites

- Node.js 14 or later
- MySQL (optional, for database tests)
- Allure command-line tool (for reports)

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Install Allure command-line (if not already installed):
   ```
   npm install -g allure-commandline
   ```

## Running Tests

### UI Registration Test
```
npm run test:ui
```

### API Login Test
```
npm run test:api
```

### Generate and Open Allure Report
```
npm run report
```

### Run Tests and Generate Report
```
npm run test:with-report
```

## Adding New Tests

1. Create a new test file extending `BaseTest`
2. Create page objects if needed
3. Implement the `run()` method
4. Add your test logic

Example:
```javascript
const BaseTest = require('../BaseTest');

class MyNewTest extends BaseTest {
    constructor() {
        super({
            testName: 'My New Test',
            testDescription: 'This test does something new.',
            cleanAllure: true
        });
    }
    
    async run() {
        try {
            await this.setup();
            
            // Test logic here
            
            await this.teardown(true);
            return { success: true };
        } catch (error) {
            await this.teardown(false, error.message);
            return { success: false, error: error.message };
        }
    }
}

module.exports = MyNewTest;
```

## Configuration

Edit `config/config.js` to change:

- Base URL
- Browser settings
- Timeouts
- Database connection details
- Output directories
- Default test data

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

This project is licensed under the ISC License.
