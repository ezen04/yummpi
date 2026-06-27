import { loadEnvConfig } from '@next/env';
import { defineConfig, devices } from '@playwright/test';

// Next.js .env.local 을 로드해 DATABASE_URL 등을 워커 프로세스에 전파한다.
// (global-setup 과 test 파일에서 PrismaClient 를 직접 사용할 때 필요)
loadEnvConfig(process.cwd());

export default defineConfig({
  testDir: 'tests',
  globalSetup: './playwright.global-setup.ts',
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
      // smoke + 다른 security 파일 (인증 불필요)
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: ['**/security/settlement.spec.ts'],
    },
    {
      // settlement E2E — storageState 로 카카오 세션 주입
      name: 'authenticated',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      testMatch: ['**/security/settlement.spec.ts'],
    },
  ],
  webServer: {
    command: 'pnpm --filter @yummpi/web start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    // e2e는 next start(production)로 띄워 NextAuth가 secret을 요구한다.
    // 랜딩(/)이 getServerSession을 호출하므로 secret이 없으면 NO_SECRET으로 500.
    // CI는 NEXTAUTH_SECRET=${{ secrets.AUTH_SECRET }}를 주입하는데 repo secret 미설정 시
    // 빈 문자열("")이 들어온다. ??는 ""를 통과시키므로 ||로 더미값까지 폴백한다.
    // (e2e 전용 더미 — 실제 비밀 아님. repo secret이 있으면 그 값이 우선.)
    env: {
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'e2e-dummy-secret',
      NEXTAUTH_URL: 'http://localhost:3000',
    },
  },
});
