import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E Testing Configuration
 * Foundation-first approach: comprehensive user workflow testing
 */
export default defineConfig({
  testDir: "../../tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  
  // Hard timeout to prevent hanging
  timeout: 15 * 1000, // 15 seconds per test MAX
  expect: {
    timeout: 3 * 1000, // 3 seconds for assertions
  },
  
  use: {
    baseURL: "http://localhost:7410",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    
    // Hard cutoff timeouts
    navigationTimeout: 5 * 1000, // 5 seconds for page loads
    actionTimeout: 3 * 1000, // 3 seconds for actions
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],

  webServer: {
    command: "echo 'Using existing Docker services'",
    url: "http://localhost:7410",
    reuseExistingServer: true,
    timeout: 10 * 1000,
  },
});