import { defineConfig, devices } from '@playwright/test';

// ⑤ QA — E2E 베이스. webServer는 dev 서버 기준.
export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:3000', ...devices['iPhone 14'] },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
