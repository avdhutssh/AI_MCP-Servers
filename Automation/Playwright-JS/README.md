# Playwright Automation Framework

A well-structured Playwright automation framework using the Page Object Model (POM) pattern with enhanced features for API testing, data-driven testing, and test dependency management.

## Framework Structure

'''
Playwright-JS/
├── config/
│   ├── config.js                # Configuration settings
│   └── TestConfig.js            # Test configuration with tags and dependencies
├── data/
│   ├── excel/                   # Excel test data files
│   └── json/                    # JSON test data files
├── pages/
│   ├── LoginPage.js             # Login page object
│   ├── RegistrationPage.js      # Registration page object
│   ├── DashboardPage.js         # Dashboard page object
│   ├── CartPage.js              # Cart page object
│   ├── CheckoutPage.js          # Checkout page object
│   ├── OrdersPage.js            # Orders page object
│   └── ProductDetailsPage.js    # Product details page object
├── reports/                     # Test reports
├── tests/
│   ├── BaseTest.js              # Base test class for UI tests
│   ├── ApiBaseTest.js           # Base test class for API tests
│   ├── api/
│   │   ├── LoginApiTest.js      # API login test
│   │   ├── ProductCatalogApiTest.js # Product catalog API test
│   │   └── OrderApiTest.js      # Order API test
│   └── ui/
│       ├── RegistrationTest.js  # Registration UI test
│       ├── LoginTest.js         # Login UI test
│       ├── ForgotPasswordTest.js # Forgot password UI test
│       ├── ProductCatalogTest.js # Product catalog UI test
│       ├── ProductSearchTest.js # Product search UI test
│       ├── ProductFilterTest.js # Product filter UI test
│       ├── ProductDetailsTest.js # Product details UI test
│       ├── AddToCartTest.js     # Add to cart UI test
│       ├── CheckoutTest.js      # Checkout UI test
│       └── OrderHistoryTest.js  # Order history UI test
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
├── runTests.js                  # Test runner with dependency resolution
└── package.json                 # Project dependencies
'''
- MySQL (optional, for database tests)
- Allure command-line tool (for reports)

## Installation

1. Clone the repository
2. Install dependencies:
   '''
   npm install
   '''
3. Install Allure command-line (if not already installed):
   '''
   npm install -g allure-commandline
   '''

## Running Tests

### UI Registration Test
'''
npm run test:ui
'''

### API Login Test
'''
npm run test:api
'''

### Generate and Open Allure Report
'''
npm run report
'''

### Run Tests and Generate Report
'''
npm run test:with-report
'''

## Adding New Tests

1. Create a new test file extending 'BaseTest'
2. Create page objects if needed
3. Implement the 'run()' method
4. Add your test logic

Example:
'''javascript
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
'''

## Configuration

Edit 'config/config.js' to change:

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
## Features

- **Page Object Model (POM)**: Separates page elements and actions from test logic
- **Test Organization**:
  - Test tagging system (smoke, critical, regression, api)
  - Test dependency management
  - Single responsibility test cases
- **Data-Driven Testing**: 
  - Support for Excel and JSON data sources
  - Fallback data when external data is unavailable
- **Comprehensive API Testing**:
  - Detailed API request/response logging
  - API-specific test base class
  - Complete API client implementation
- **Reporting**:
  - Allure reporting with screenshots
  - API request/response details in reports
  - Test steps and attachments
- **Integration**:
  - Database connectivity
  - Excel data operations
  - API client
- **Utilities**:
  - Robust logging system
  - Common utilities
  - Configuration management

## Prerequisites

- Node.js 14 or later
- Playwright
- Allure command-line tool (for reports)

## Installation

'''bash
# Clone the repository
git clone <repository-url>

# Navigate to the project directory
cd Playwright-JS

# Install dependencies
npm install
'''

## Running Tests

The framework provides multiple ways to run tests:

'''bash
# Run all tests
npm run test:all

# Run smoke tests
npm run test:smoke

# Run critical tests
npm run test:critical

# Run regression tests
npm run test:regression

# Run API tests
npm run test:api:all

# Run specific API tests
npm run test:api:catalog
npm run test:api:order

# Run a specific test
npm run test:specific -- --test registration

# Generate and open Allure report
npm run report
'''

## Test Configuration

Tests are configured in 'config/TestConfig.js' with tags and dependencies. The test runner automatically resolves dependencies and executes tests in the correct order.

Example test configuration:

'''javascript
"registration": {
    path: "tests/ui/RegistrationTest.js",
    description: "Register new user account",
    tags: ["smoke", "critical", "regression"],
    dependencies: [],
    dataSources: ["users"]
}
'''

## Data-Driven Testing

The framework supports data-driven testing with Excel and JSON data sources:

'''javascript
// Example data source configuration
"users": {
    type: "excel",
    path: "../data/excel/users.xlsx",
    sheet: "Users",
    fallback: [
        {
            email: "test1@example.com",
            password: "Test@123",
            firstName: "John",
            lastName: "Doe"
        }
    ]
}
'''

## Adding New Tests

1. Create a test file in the appropriate directory (ui/ or api/)
2. Extend the appropriate base class (BaseTest or ApiBaseTest)
3. Add the test to the TestConfig.js file with appropriate tags and dependencies
4. Create page objects if needed

## Reporting

The framework uses Allure for reporting. After running tests, generate and open the report:

'''bash
npm run report
'''

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
