import { defineConfig, devices } from '@playwright/test';

const dashboardPort=Number(process.env.CHAYBOOK_DASHBOARD_PORT || 5190);

export default defineConfig({
  testDir: './tests',
  testMatch: /system-dashboard\.spec\.js/,
  grep: process.env.CHAYBOOK_DASHBOARD_GREP ? new RegExp(process.env.CHAYBOOK_DASHBOARD_GREP) : undefined,
  timeout: 60000,
  expect: { timeout: 10000 },
  workers: 1,
  retries: 0,
  forbidOnly: true,
  outputDir: process.env.PW_ARTIFACT_DIR || 'reports/system-dashboard-artifacts',
  reporter: [
    ['list'],
    ['html', { outputFolder: process.env.PW_HTML_DIR || 'reports/system-dashboard-html', open: 'never' }],
    ['json', { outputFile: process.env.PW_JSON_FILE || 'reports/system-dashboard-results.json' }],
    ['junit', { outputFile: process.env.PW_JUNIT_FILE || 'reports/system-dashboard-junit.xml' }],
  ],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: `http://127.0.0.1:${dashboardPort}`,
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  globalSetup: './tools/start-testing-dashboard.mjs',
});
