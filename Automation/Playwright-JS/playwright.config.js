// playwright.config.js
// Playwright Test configuration

const { defineConfig } = require('@playwright/test');
const config = require('./config/config');

module.exports = defineConfig({
  testDir: './tests',
  timeout: config.timeouts.global,
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],
  use: {
    baseURL: config.baseUrl,
    headless: config.browser.headless,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    video: 'on-first-retry',
    screenshot: config.browser.screenshot,
    trace: 'on-first-retry',
    actionTimeout: config.timeouts.element,
    navigationTimeout: config.timeouts.navigation,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
    {
      name: 'firefox',
      use: { browserName: 'firefox' },
    },
    {
      name: 'webkit',
      use: { browserName: 'webkit' },
    },
  ],
});
