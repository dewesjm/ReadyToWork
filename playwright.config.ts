import { defineConfig, devices } from '@playwright/test';

/**
 * Browser checks: accessibility (axe) on the main pages, phone and desktop, light and dark.
 * Run with `npm run e2e`. Uses the installed Chrome; starts the dev server if it isn't running.
 */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4200',
    channel: 'chrome',
  },
  projects: [
    { name: 'phone', use: { ...devices['Pixel 7'], channel: 'chrome' } },
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 } } },
  ],
  webServer: {
    command: 'npm start',
    url: 'http://localhost:4200',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
