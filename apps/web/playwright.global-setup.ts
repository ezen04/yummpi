import { chromium, type FullConfig } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';

const AUTH_DIR = path.join(process.cwd(), 'playwright/.auth');
const AUTH_FILE = path.join(AUTH_DIR, 'user.json');
const SEED_FILE = path.join(AUTH_DIR, 'seed-meetings.json');

// settlement E2E가 사용하는 seed inviteCode 목록.
// SEEDPAY1: CONFIRMED 정산 (BE-1 조회용)
// SEEDPAY3: 정산 없음 (BE-2a 영수증 직접 입력 + BE-3 정산 생성용)
// SEEDPAY4: DRAFT ITEM_BASED 정산 (BE-4 항목 배정용)
const SEED_CODES = ['SEEDPAY1', 'SEEDPAY3', 'SEEDPAY4'] as const;

export default async function globalSetup(config: FullConfig) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });

  // 1. Prisma로 seed 모임·정산 ID 조회 → seed-meetings.json에 기록.
  //    DATABASE_URL 미설정(CI·smoke-only 실행)이면 빈 픽스처로 대체.
  //    seed guard(test.skip(!seed[...]))가 있는 테스트는 자동으로 건너뜀.
  if (process.env.DATABASE_URL) {
    const prisma = new PrismaClient();
    try {
      const meetings = await prisma.meeting.findMany({
        where: { inviteCode: { in: [...SEED_CODES] } },
        select: {
          id: true,
          inviteCode: true,
          settlement: { select: { id: true } },
        },
      });

      const fixture: Record<string, string> = { __dbReady: 'true' };
      for (const m of meetings) {
        if (!m.inviteCode) continue;
        fixture[m.inviteCode] = m.id;
        // SEEDPAY4 정산 ID (PUT /assignments/me 경로에 필요)
        if (m.inviteCode === 'SEEDPAY4' && m.settlement) {
          fixture['SEEDPAY4_SETTLEMENT'] = m.settlement.id;
        }
      }

      fs.writeFileSync(SEED_FILE, JSON.stringify(fixture, null, 2));
      console.log('[e2e setup] seed fixture:', fixture);

      if (SEED_CODES.some((c) => !fixture[c])) {
        console.warn(
          '[e2e setup] ⚠️  일부 seed 모임이 없습니다. pnpm db seed 를 먼저 실행하세요.'
        );
      }
    } finally {
      await prisma.$disconnect();
    }
  } else {
    // DB 없이 실행 — 빈 픽스처. seed 의존 테스트는 test.skip으로 건너뜀.
    if (!fs.existsSync(SEED_FILE)) {
      fs.writeFileSync(SEED_FILE, JSON.stringify({}, null, 2));
    }
    console.log(
      '[e2e setup] DATABASE_URL 미설정 — seed 픽스처 없이 실행 (DB 불필요 테스트만 동작)'
    );
  }

  // 2. 세션 파일이 이미 있으면 재사용.
  if (fs.existsSync(AUTH_FILE)) {
    console.log('[e2e setup] 기존 세션 재사용:', AUTH_FILE);
    return;
  }

  // 3. CI 환경: 대화형 카카오 로그인 불가 → 빈 storageState로 대체.
  //    실제 인증이 필요한 테스트는 403을 받거나 seed guard로 건너뜀.
  if (process.env.CI) {
    fs.writeFileSync(
      AUTH_FILE,
      JSON.stringify({ cookies: [], origins: [] }, null, 2)
    );
    console.log(
      '[e2e setup] CI 환경 — 카카오 로그인 불가. 빈 세션으로 실행 (인증 필요 테스트는 403 또는 skip).'
    );
    return;
  }

  // 4. 로컬: headed 브라우저를 열어 카카오 로그인 후 storageState 저장.
  const baseURL =
    config.projects.find((p) => p.name === 'authenticated')?.use.baseURL ??
    'http://localhost:3000';

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log(
    '\n⚠️  카카오 로그인이 필요합니다. 열린 브라우저에서 로그인을 완료해 주세요 (최대 2분).\n'
  );
  await page.goto(`${baseURL}/api/auth/signin`);

  // 로그인 완료 판정: Kakao / NextAuth 콜백 URL을 벗어나면 완료.
  await page.waitForURL(
    (url) => !url.href.includes('/api/auth') && !url.href.includes('kakao.com'),
    { timeout: 120_000 }
  );

  await page.context().storageState({ path: AUTH_FILE });
  await browser.close();
  console.log('[e2e setup] 세션 저장 완료:', AUTH_FILE);
}
