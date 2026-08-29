import { defineConfig, devices } from '@playwright/test'

/**
 * تست‌های End-to-End
 *
 * اجرا:
 *   npm run test:e2e
 *
 * برای اجرا روی سایتِ در حال اجرا:
 *   E2E_BASE_URL=https://example.com npx playwright test
 *
 * اگر E2E_BASE_URL تنظیم شود، سرور به‌صورت خودکار بالا نمی‌آید
 * (و نیازی به پایگاه‌داده در محیط تست نیست).
 */
const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:3000'
const reuseExistingServer = Boolean(process.env.E2E_BASE_URL)

export default defineConfig({
  testDir: './tests',
  testMatch: /.*\.spec\.ts/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  timeout: 60_000,

  use: {
    baseURL,
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: reuseExistingServer
    ? undefined
    : {
        command: 'npm run start',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
})
