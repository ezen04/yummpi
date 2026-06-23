import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:3000',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm --filter @yummpi/web start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    // e2e는 next start(production)로 띄워 NextAuth가 secret을 요구한다.
    // 랜딩(/)이 getServerSession을 호출하므로 secret이 없으면 NO_SECRET으로 500.
    // 실제 비밀이 아닌 e2e 전용 더미값(있으면 CI secret 우선).
    env: {
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? 'e2e-dummy-secret',
      NEXTAUTH_URL: 'http://localhost:3000',
    },
  },
});
