import { defineConfig, devices } from 'playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL;
if (!baseURL)
  throw new Error('Use yarn test:e2e to build and start an isolated production server.');
const averages = process.env.E2E_SUITE === 'averages';
const workers = Number(process.env.E2E_WORKERS ?? 1);
if (!Number.isInteger(workers) || workers < 1)
  throw new Error('E2E_WORKERS must be a positive integer.');

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: averages ? '**/average-charts.spec.ts' : '**/*.spec.ts',
  testIgnore: averages ? [] : ['**/average-charts.spec.ts'],
  outputDir: process.env.E2E_OUTPUT_DIR ?? 'test-results',
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  fullyParallel: false,
  workers,
  reporter: [
    [process.env.CI ? 'dot' : 'list'],
    ['html', { outputFolder: process.env.E2E_REPORT_DIR ?? 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
