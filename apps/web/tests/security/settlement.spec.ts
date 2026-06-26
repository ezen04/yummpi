import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';

const BASE = '/api/v1';

// DB에 없는 UUID (UUID v1 형식 — safeParse 통과, DB 조회 시 null)
const GHOST_UUID = '11111111-1111-1111-8111-111111111111';

// global-setup 이 기록한 seed 픽스처 파일 (meetingId / settlementId)
const SEED_FILE = path.join(
  process.cwd(),
  'playwright/.auth/seed-meetings.json'
);

function loadSeed(): Record<string, string> {
  try {
    return JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
  } catch {
    return {};
  }
}

// 각 describe 의 beforeAll 에서 채운다. 최상위 beforeAll 은 워커 격리로 인해
// describe 간 공유가 불안정하므로 각 블록에서 직접 호출한다.
let seed: Record<string, string> = {};

// ── 파라미터 검증 (auth·DB 불필요 — 항상 실행) ───────────────────────────────
//
// 각 라우트는 Prisma·requireMember 보다 UUID 형식을 먼저 safeParse 한다.
// 비-UUID 세그먼트는 Next.js App Router 가 그대로 전달하므로
// DB·세션 없이도 400 응답을 받을 수 있다.

test.describe('파라미터 검증 (auth·DB 불필요)', () => {
  test('BE-1 GET /settlement — 비-UUID meetingId → 400', async ({
    request,
  }) => {
    const res = await request.get(`${BASE}/meetings/not-a-uuid/settlement`);
    expect(res.status()).toBe(400);
    expect((await res.json()).error.code).toBe('VALIDATION_ERROR');
  });

  test('BE-2a POST /receipts/manual — 비-UUID meetingId → 400', async ({
    request,
  }) => {
    const res = await request.post(
      `${BASE}/meetings/not-a-uuid/receipts/manual`,
      {
        data: {
          totalAmount: 10000,
          items: [
            { name: '치킨', quantity: 1, unitPrice: 10000, totalPrice: 10000 },
          ],
        },
      }
    );
    expect(res.status()).toBe(400);
    expect((await res.json()).error.code).toBe('VALIDATION_ERROR');
  });

  test('BE-3 POST /settlements — 비-UUID meetingId → 400', async ({
    request,
  }) => {
    const res = await request.post(`${BASE}/meetings/not-a-uuid/settlements`, {
      data: { splitMethod: 'EQUAL' },
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).error.code).toBe('VALIDATION_ERROR');
  });

  test('BE-4 PUT /assignments/me — 비-UUID 경로 파라미터 → 400', async ({
    request,
  }) => {
    const res = await request.put(
      `${BASE}/meetings/not-a-uuid/settlements/not-a-uuid/assignments/me`,
      { data: { receiptItemIds: ['11111111-1111-1111-8111-111111111111'] } }
    );
    expect(res.status()).toBe(400);
    expect((await res.json()).error.code).toBe('VALIDATION_ERROR');
  });
});

// ── 존재하지 않는 모임 (DB 필요, auth 불필요) ────────────────────────────────
//
// 라우트가 requireMember 보다 모임 존재를 먼저 확인하므로,
// 유효한 UUID 이지만 DB 에 없으면 403 이 아닌 404 를 반환한다.

test.describe('존재하지 않는 모임 — 404', () => {
  test.beforeAll(() => {
    seed = loadSeed();
  });

  test('BE-1 GET /settlement — 없는 meetingId → 404 MEETING_NOT_FOUND', async ({
    request,
  }) => {
    test.skip(
      !seed['__dbReady'],
      'DB 없이 실행 — 404 검증 불가 (DB 연결 필요)'
    );
    const res = await request.get(`${BASE}/meetings/${GHOST_UUID}/settlement`);
    expect(res.status()).toBe(404);
    expect((await res.json()).error.code).toBe('MEETING_NOT_FOUND');
  });

  test('BE-3 POST /settlements — 없는 meetingId → 404 MEETING_NOT_FOUND', async ({
    request,
  }) => {
    test.skip(
      !seed['__dbReady'],
      'DB 없이 실행 — 404 검증 불가 (DB 연결 필요)'
    );
    const res = await request.post(
      `${BASE}/meetings/${GHOST_UUID}/settlements`,
      { data: { splitMethod: 'EQUAL' } }
    );
    expect(res.status()).toBe(404);
    expect((await res.json()).error.code).toBe('MEETING_NOT_FOUND');
  });
});

// ── 무인증 접근 차단 (DB 필요, seed meetingId 사용) ──────────────────────────
//
// authenticated 프로젝트 안에서 storageState 를 빈 값으로 override 해
// 쿠키 없는 요청을 만든다. requireMember → FORBIDDEN(403).
// 단, 라우트가 모임 존재를 먼저 보므로 seed 모임이 DB 에 있어야 403 에 닿는다.

test.describe('무인증 접근 차단 — 403', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeAll(() => {
    seed = loadSeed();
  });

  test('BE-1 GET /settlement → 403 FORBIDDEN', async ({ request }) => {
    test.skip(!seed['SEEDPAY1'], 'seed 미적용 — pnpm db seed 실행 필요');
    const res = await request.get(
      `${BASE}/meetings/${seed['SEEDPAY1']}/settlement`
    );
    expect(res.status()).toBe(403);
    expect((await res.json()).error.code).toBe('FORBIDDEN');
  });

  test('BE-2a POST /receipts/manual → 403 FORBIDDEN', async ({ request }) => {
    test.skip(!seed['SEEDPAY3'], 'seed 미적용');
    const res = await request.post(
      `${BASE}/meetings/${seed['SEEDPAY3']}/receipts/manual`,
      {
        data: {
          totalAmount: 10000,
          items: [
            { name: '치킨', quantity: 1, unitPrice: 10000, totalPrice: 10000 },
          ],
        },
      }
    );
    expect(res.status()).toBe(403);
    expect((await res.json()).error.code).toBe('FORBIDDEN');
  });

  test('BE-3 POST /settlements → 403 FORBIDDEN', async ({ request }) => {
    test.skip(!seed['SEEDPAY3'], 'seed 미적용');
    const res = await request.post(
      `${BASE}/meetings/${seed['SEEDPAY3']}/settlements`,
      { data: { splitMethod: 'EQUAL' } }
    );
    expect(res.status()).toBe(403);
    expect((await res.json()).error.code).toBe('FORBIDDEN');
  });

  test('BE-4 PUT /assignments/me → 403 FORBIDDEN', async ({ request }) => {
    test.skip(!seed['SEEDPAY4'] || !seed['SEEDPAY4_SETTLEMENT'], 'seed 미적용');
    const res = await request.put(
      `${BASE}/meetings/${seed['SEEDPAY4']}/settlements/${seed['SEEDPAY4_SETTLEMENT']}/assignments/me`,
      { data: { receiptItemIds: [GHOST_UUID] } }
    );
    expect(res.status()).toBe(403);
    expect((await res.json()).error.code).toBe('FORBIDDEN');
  });
});

// ── BE-1: GET /settlement ─────────────────────────────────────────────────────

test.describe('BE-1 GET /settlement', () => {
  test.beforeAll(() => {
    seed = loadSeed();
  });

  test('SEEDPAY1 (CONFIRMED 정산) → 200 + 응답 구조 검증', async ({
    request,
  }) => {
    test.skip(!seed['SEEDPAY1'], 'seed 미적용');
    const res = await request.get(
      `${BASE}/meetings/${seed['SEEDPAY1']}/settlement`
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toMatchObject({
      totalAmount: expect.any(Number),
      splitMethod: expect.stringMatching(/^(EQUAL|ITEM_BASED)$/),
      settlementMembers: expect.arrayContaining([
        expect.objectContaining({
          memberId: expect.any(String),
          finalAmount: expect.any(Number),
        }),
      ]),
    });
  });

  test('SEEDPAY3 (정산 없음) → 404 SETTLEMENT_NOT_FOUND', async ({
    request,
  }) => {
    test.skip(!seed['SEEDPAY3'], 'seed 미적용');
    const res = await request.get(
      `${BASE}/meetings/${seed['SEEDPAY3']}/settlement`
    );
    expect(res.status()).toBe(404);
    expect((await res.json()).error.code).toBe('SETTLEMENT_NOT_FOUND');
  });
});

// ── BE-2a: POST /receipts/manual ─────────────────────────────────────────────
//
// SEEDPAY3 를 사용. 멱등성을 위해 afterAll 에서 생성된 영수증을 삭제한다.
// SEEDPAY4 에도 영수증을 추가해 BE-4 테스트용 receiptItemId 를 확보한다.

test.describe('BE-2a POST /receipts/manual', () => {
  test.beforeAll(() => {
    seed = loadSeed();
  });

  test.afterAll(async () => {
    if (!seed['SEEDPAY3']) return;
    const prisma = new PrismaClient();
    try {
      // 이 describe 가 영수증을 추가하는 곳은 SEEDPAY3 뿐. SEEDPAY4 는 BE-4 가
      // 자체 관리하므로 여기서 건드리면 fullyParallel 환경에서 BE-4 셋업을 지운다.
      await prisma.receipt.deleteMany({
        where: { meetingId: seed['SEEDPAY3'] },
      });
    } finally {
      await prisma.$disconnect();
    }
  });

  test('SEEDPAY3 + 유효 body → 201 + receipt 반환', async ({ request }) => {
    test.skip(!seed['SEEDPAY3'], 'seed 미적용');
    const res = await request.post(
      `${BASE}/meetings/${seed['SEEDPAY3']}/receipts/manual`,
      {
        data: {
          totalAmount: 27000,
          items: [
            { name: '치킨', quantity: 1, unitPrice: 18000, totalPrice: 18000 },
            { name: '맥주', quantity: 1, unitPrice: 9000, totalPrice: 9000 },
          ],
        },
      }
    );
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toMatchObject({
      receiptId: expect.any(String),
      totalAmount: 27000,
      items: expect.arrayContaining([
        expect.objectContaining({ name: '치킨', totalPrice: 18000 }),
      ]),
    });
  });

  test('items 누락(빈 배열) → 400 VALIDATION_ERROR', async ({ request }) => {
    test.skip(!seed['SEEDPAY3'], 'seed 미적용');
    const res = await request.post(
      `${BASE}/meetings/${seed['SEEDPAY3']}/receipts/manual`,
      { data: { totalAmount: 10000, items: [] } }
    );
    expect(res.status()).toBe(400);
    expect((await res.json()).error.code).toBe('VALIDATION_ERROR');
  });

  test('totalAmount 누락 → 400 VALIDATION_ERROR', async ({ request }) => {
    test.skip(!seed['SEEDPAY3'], 'seed 미적용');
    const res = await request.post(
      `${BASE}/meetings/${seed['SEEDPAY3']}/receipts/manual`,
      {
        data: {
          items: [
            { name: '치킨', quantity: 1, unitPrice: 9000, totalPrice: 9000 },
          ],
        },
      }
    );
    expect(res.status()).toBe(400);
    expect((await res.json()).error.code).toBe('VALIDATION_ERROR');
  });
});

// ── BE-3: POST /settlements ───────────────────────────────────────────────────
//
// 409 케이스(SEEDPAY1 — 이미 정산 존재)는 멱등.
// 201 케이스(SEEDPAY3 — 정산 없음)는 afterAll 에서 정산 삭제로 멱등화.

test.describe('BE-3 POST /settlements', () => {
  test.beforeAll(() => {
    seed = loadSeed();
  });

  test.afterAll(async () => {
    if (!seed['SEEDPAY3']) return;
    const prisma = new PrismaClient();
    try {
      // 이 테스트가 만든 정산 제거 (다음 실행을 위해)
      await prisma.settlement.deleteMany({
        where: { meetingId: seed['SEEDPAY3'] },
      });
    } finally {
      await prisma.$disconnect();
    }
  });

  test('SEEDPAY1 (정산 이미 존재) → 409 SETTLEMENT_ALREADY_EXISTS', async ({
    request,
  }) => {
    test.skip(!seed['SEEDPAY1'], 'seed 미적용');
    const res = await request.post(
      `${BASE}/meetings/${seed['SEEDPAY1']}/settlements`,
      { data: { splitMethod: 'EQUAL' } }
    );
    expect(res.status()).toBe(409);
    expect((await res.json()).error.code).toBe('SETTLEMENT_ALREADY_EXISTS');
  });

  test('splitMethod 누락 → 400 VALIDATION_ERROR', async ({ request }) => {
    test.skip(!seed['SEEDPAY3'], 'seed 미적용');
    const res = await request.post(
      `${BASE}/meetings/${seed['SEEDPAY3']}/settlements`,
      { data: {} }
    );
    expect(res.status()).toBe(400);
    expect((await res.json()).error.code).toBe('VALIDATION_ERROR');
  });

  test('SEEDPAY3 + EQUAL → 201 + settlement 반환', async ({ request }) => {
    test.skip(!seed['SEEDPAY3'], 'seed 미적용');
    // SEEDPAY3 에는 영수증이 없으므로 EQUAL + totalAmount 를 직접 제공해야 한다.
    const res = await request.post(
      `${BASE}/meetings/${seed['SEEDPAY3']}/settlements`,
      { data: { splitMethod: 'EQUAL', totalAmount: 30000 } }
    );
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toMatchObject({
      splitMethod: 'EQUAL',
      totalAmount: expect.any(Number),
    });
  });
});

// ── BE-4: PUT /assignments/me ─────────────────────────────────────────────────
//
// SEEDPAY4 는 ITEM_BASED DRAFT 정산을 가진다.
// receiptItemIds 는 min(1) 필수이므로, 먼저 SEEDPAY4 에 영수증을 추가해 itemId 를 확보한다.

test.describe('BE-4 PUT /assignments/me', () => {
  let receiptItemId: string | null = null;

  test.beforeAll(async () => {
    seed = loadSeed();
    if (!seed['SEEDPAY4']) return;

    // SEEDPAY4 는 settlement 이 존재해 assertReceiptAddable 이 API 경로(POST /receipts/manual)를
    // RECEIPT_LOCKED 로 막는다. 테스트 셋업에 한해 Prisma 로 receipt + item 을 직접 생성한다.
    const prisma = new PrismaClient();
    try {
      const existing = await prisma.receipt.findFirst({
        where: { meetingId: seed['SEEDPAY4'] },
        include: { items: { take: 1 } },
      });
      if (existing?.items[0]) {
        receiptItemId = existing.items[0].id;
        return;
      }

      const hostMember = await prisma.meetingMember.findFirst({
        where: { meetingId: seed['SEEDPAY4'], role: 'HOST' },
        select: { id: true },
      });

      const receipt = await prisma.receipt.create({
        data: {
          meetingId: seed['SEEDPAY4'],
          uploadedByMemberId: hostMember?.id,
          ocrStatus: 'SUCCEEDED',
          totalAmount: 15000,
          items: {
            create: [
              {
                name: '테스트 항목',
                quantity: 1,
                unitPrice: 15000,
                totalPrice: 15000,
                sortOrder: 0,
              },
            ],
          },
        },
        include: { items: true },
      });
      receiptItemId = receipt.items[0]?.id ?? null;
    } finally {
      await prisma.$disconnect();
    }
  });

  test.afterAll(async () => {
    if (!seed['SEEDPAY4']) return;
    const prisma = new PrismaClient();
    try {
      await prisma.receipt.deleteMany({
        where: { meetingId: seed['SEEDPAY4'] },
      });
    } finally {
      await prisma.$disconnect();
    }
  });

  test('body 누락(receiptItemIds 없음) → 400 VALIDATION_ERROR', async ({
    request,
  }) => {
    test.skip(!seed['SEEDPAY4'] || !seed['SEEDPAY4_SETTLEMENT'], 'seed 미적용');
    const res = await request.put(
      `${BASE}/meetings/${seed['SEEDPAY4']}/settlements/${seed['SEEDPAY4_SETTLEMENT']}/assignments/me`,
      { data: {} }
    );
    expect(res.status()).toBe(400);
    expect((await res.json()).error.code).toBe('VALIDATION_ERROR');
  });

  test('receiptItemIds 빈 배열 → 400 VALIDATION_ERROR (min 1 필수)', async ({
    request,
  }) => {
    test.skip(!seed['SEEDPAY4'] || !seed['SEEDPAY4_SETTLEMENT'], 'seed 미적용');
    const res = await request.put(
      `${BASE}/meetings/${seed['SEEDPAY4']}/settlements/${seed['SEEDPAY4_SETTLEMENT']}/assignments/me`,
      { data: { receiptItemIds: [] } }
    );
    expect(res.status()).toBe(400);
    expect((await res.json()).error.code).toBe('VALIDATION_ERROR');
  });

  test('유효한 receiptItemId → 200 + 저장 확인', async ({ request }) => {
    test.skip(
      !seed['SEEDPAY4'] || !seed['SEEDPAY4_SETTLEMENT'] || !receiptItemId,
      'seed 미적용 또는 영수증 없음 — BE-2a 로 SEEDPAY4 에 영수증 추가 후 재실행'
    );
    const res = await request.put(
      `${BASE}/meetings/${seed['SEEDPAY4']}/settlements/${seed['SEEDPAY4_SETTLEMENT']}/assignments/me`,
      { data: { receiptItemIds: [receiptItemId] } }
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toMatchObject({
      memberId: expect.any(String),
      receiptItemIds: [receiptItemId],
    });
  });
});
