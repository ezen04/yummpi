import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';

// fullyParallel: true 환경에서 describe 블록 간 DB 경쟁 조건 방지.
// beforeAll/afterAll이 순서에 의존하므로(SEEDPAY3 settlement 생성/삭제 등) 직렬 실행 필수.
test.describe.configure({ mode: 'serial' });

const BASE = '/api/v1';

// DB에 없는 UUID — safeParse 통과, DB 조회 시 null
const GHOST_UUID = '11111111-1111-1111-8111-111111111111';

// global-setup(playwright.global-setup.ts)이 DB에서 읽어 기록한 픽스처.
// 전체 seed 정의는 apps/server/prisma/seed.ts 참조.
// 이 파일에서 사용하는 시드:
//
//   SEEDPAY1  status=SETTLING · settlement=CONFIRMED · 영수증 있음
//             → 정산 조회(200), 영수증 삭제 불가(403), 정산 중복 생성(409) 검증용
//
//   SEEDPAY3  status=SETTLING · settlement=없음 · 영수증 없음
//             → 영수증 추가(201), 정산 생성(201), 정산 확정(200) 검증용
//             ※ 각 섹션 afterAll이 생성한 데이터를 정리해 멱등성 보장
//
//   SEEDPAY4  status=SETTLING · settlement=DRAFT(ITEM_BASED) · SettlementMember 있음
//             → 영수증 추가 잠금(409), 항목 배정(200), 확정 불가(409) 검증용
//             SEEDPAY4_SETTLEMENT: SEEDPAY4의 settlementId (assignments 경로에 필요)
//
//   __dbReady  DATABASE_URL이 설정된 환경에서만 'true' — 404 검증 등 DB 필요 케이스 skip 판단용
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

// 각 describe의 beforeAll에서 채운다. 최상위 beforeAll은 워커 격리로 인해
// describe 간 공유가 불안정하므로 각 블록에서 직접 호출한다.
let seed: Record<string, string> = {};

// ── GET /meetings/:meetingId/settlement ───────────────────────────────────────

test.describe('GET /meetings/:meetingId/settlement', () => {
  test.beforeAll(async () => {
    seed = loadSeed();
    // 이전 실행 잔여 데이터 정리 — SEEDPAY3는 정산이 없어야 404가 반환된다.
    if (!seed['SEEDPAY3']) return;
    const prisma = new PrismaClient();
    try {
      await prisma.settlement.deleteMany({
        where: { meetingId: seed['SEEDPAY3'] },
      });
    } finally {
      await prisma.$disconnect();
    }
  });

  test('비-UUID meetingId → 400 VALIDATION_ERROR', async ({ request }) => {
    const res = await request.get(`${BASE}/meetings/not-a-uuid/settlement`);
    expect(res.status()).toBe(400);
    expect((await res.json()).error.code).toBe('VALIDATION_ERROR');
  });

  test('없는 meetingId → 404 MEETING_NOT_FOUND', async ({ request }) => {
    test.skip(!seed['__dbReady'], 'DB 없이 실행 — 404 검증 불가');
    const res = await request.get(`${BASE}/meetings/${GHOST_UUID}/settlement`);
    expect(res.status()).toBe(404);
    expect((await res.json()).error.code).toBe('MEETING_NOT_FOUND');
  });

  test.describe('무인증', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('→ 403 FORBIDDEN', async ({ request }) => {
      test.skip(!seed['SEEDPAY1'], 'seed 미적용');
      const res = await request.get(
        `${BASE}/meetings/${seed['SEEDPAY1']}/settlement`
      );
      expect(res.status()).toBe(403);
      expect((await res.json()).error.code).toBe('FORBIDDEN');
    });
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

// ── POST /meetings/:meetingId/receipts/manual ─────────────────────────────────
//
// afterAll: SEEDPAY3에 생성된 영수증을 삭제해 멱등성 유지.
// SEEDPAY4 (DRAFT 정산 존재) 케이스는 서버가 거부하므로 데이터 생성 없음 — 정리 불필요.

test.describe('POST /meetings/:meetingId/receipts/manual', () => {
  test.beforeAll(() => {
    seed = loadSeed();
  });

  test.afterAll(async () => {
    if (!seed['SEEDPAY3']) return;
    const prisma = new PrismaClient();
    try {
      await prisma.receipt.deleteMany({
        where: { meetingId: seed['SEEDPAY3'] },
      });
    } finally {
      await prisma.$disconnect();
    }
  });

  test('비-UUID meetingId → 400 VALIDATION_ERROR', async ({ request }) => {
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

  test('없는 meetingId → 404 MEETING_NOT_FOUND', async ({ request }) => {
    test.skip(!seed['__dbReady'], 'DB 없이 실행 — 404 검증 불가');
    const res = await request.post(
      `${BASE}/meetings/${GHOST_UUID}/receipts/manual`,
      {
        data: {
          totalAmount: 10000,
          items: [
            { name: '치킨', quantity: 1, unitPrice: 10000, totalPrice: 10000 },
          ],
        },
      }
    );
    expect(res.status()).toBe(404);
    expect((await res.json()).error.code).toBe('MEETING_NOT_FOUND');
  });

  test.describe('무인증', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('→ 403 FORBIDDEN', async ({ request }) => {
      test.skip(!seed['SEEDPAY3'], 'seed 미적용');
      const res = await request.post(
        `${BASE}/meetings/${seed['SEEDPAY3']}/receipts/manual`,
        {
          data: {
            totalAmount: 10000,
            items: [
              {
                name: '치킨',
                quantity: 1,
                unitPrice: 10000,
                totalPrice: 10000,
              },
            ],
          },
        }
      );
      expect(res.status()).toBe(403);
      expect((await res.json()).error.code).toBe('FORBIDDEN');
    });
  });

  test('items 빈 배열 → 400 VALIDATION_ERROR', async ({ request }) => {
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

  test('SEEDPAY4 (DRAFT 정산 존재) → 409 RECEIPT_LOCKED', async ({
    request,
  }) => {
    test.skip(!seed['SEEDPAY4'], 'seed 미적용');
    const res = await request.post(
      `${BASE}/meetings/${seed['SEEDPAY4']}/receipts/manual`,
      {
        data: {
          totalAmount: 10000,
          items: [
            {
              name: '테스트',
              quantity: 1,
              unitPrice: 10000,
              totalPrice: 10000,
            },
          ],
        },
      }
    );
    expect(res.status()).toBe(409);
    expect((await res.json()).error.code).toBe('RECEIPT_LOCKED');
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
});

// ── DELETE /meetings/:meetingId/receipts/:receiptId ───────────────────────────
//
// 성공 케이스(SEEDPAY3)용 영수증은 beforeAll에서 Prisma로 직접 생성한다.
// — POST /receipts는 S3 presigned URL 없이는 호출 불가하고,
//   POST /receipts/manual은 위 섹션 afterAll과 충돌을 피하기 위해 쓰지 않는다.
// SEEDPAY4 영수증(409 케이스)은 항상 새로 생성 — afterAll에서 직접 정리.
//   beforeAll에서 SEEDPAY4 settlement를 DRAFT로 초기화(이전 실행에서 CONFIRMED로
//   전환됐을 수 있으므로). seed.ts는 SEEDPAY1에 Receipt를 만들지 않으므로
// SEEDPAY1 영수증(403 케이스)도 beforeAll에서 직접 생성, afterAll에서 정리.

test.describe('DELETE /meetings/:meetingId/receipts/:receiptId', () => {
  let deleteReceiptId: string | null = null; // SEEDPAY3 — 204 케이스
  let lockedReceiptId: string | null = null; // SEEDPAY4 — 409 RECEIPT_LOCKED
  let confirmedReceiptId: string | null = null; // SEEDPAY1 — 403 FORBIDDEN

  test.beforeAll(async () => {
    seed = loadSeed();
    const prisma = new PrismaClient();
    try {
      if (seed['SEEDPAY3']) {
        const host = await prisma.meetingMember.findFirst({
          where: { meetingId: seed['SEEDPAY3'], role: 'HOST' },
          select: { id: true },
        });
        const r = await prisma.receipt.create({
          data: {
            meetingId: seed['SEEDPAY3'],
            uploadedByMemberId: host?.id,
            ocrStatus: 'SUCCEEDED',
            totalAmount: 10000,
          },
        });
        deleteReceiptId = r.id;
      }

      if (seed['SEEDPAY4']) {
        // 이전 실행에서 settlement가 CONFIRMED로 바뀌었을 경우 DRAFT로 초기화
        await prisma.settlement.updateMany({
          where: { meetingId: seed['SEEDPAY4'] },
          data: { status: 'DRAFT', confirmedAt: null },
        });
        // 잔여 영수증 정리 후 신규 생성 — 항상 fresh id 사용
        await prisma.receipt.deleteMany({
          where: { meetingId: seed['SEEDPAY4'] },
        });
        const host = await prisma.meetingMember.findFirst({
          where: { meetingId: seed['SEEDPAY4'], role: 'HOST' },
          select: { id: true },
        });
        const r = await prisma.receipt.create({
          data: {
            meetingId: seed['SEEDPAY4'],
            uploadedByMemberId: host?.id,
            ocrStatus: 'SUCCEEDED',
            totalAmount: 10000,
          },
        });
        lockedReceiptId = r.id;
      }

      if (seed['SEEDPAY1']) {
        // seed.ts가 SEEDPAY1 Receipt를 생성하지 않으므로 여기서 직접 생성.
        // 잔여 데이터가 있으면 먼저 정리.
        await prisma.receipt.deleteMany({
          where: { meetingId: seed['SEEDPAY1'] },
        });
        const host = await prisma.meetingMember.findFirst({
          where: { meetingId: seed['SEEDPAY1'], role: 'HOST' },
          select: { id: true },
        });
        const r = await prisma.receipt.create({
          data: {
            meetingId: seed['SEEDPAY1'],
            uploadedByMemberId: host?.id,
            ocrStatus: 'SUCCEEDED',
            totalAmount: 10000,
          },
        });
        confirmedReceiptId = r.id;
      }
    } finally {
      await prisma.$disconnect();
    }
  });

  test.afterAll(async () => {
    // 204 테스트 성공 시 deleteReceiptId는 null — 해당 영수증은 이미 삭제됨.
    // lockedReceiptId(SEEDPAY4) · confirmedReceiptId(SEEDPAY1)는 항상 정리.
    const toDelete = [
      deleteReceiptId,
      lockedReceiptId,
      confirmedReceiptId,
    ].filter(Boolean) as string[];
    if (toDelete.length === 0) return;
    const prisma = new PrismaClient();
    try {
      await prisma.receipt.deleteMany({ where: { id: { in: toDelete } } });
    } finally {
      await prisma.$disconnect();
    }
  });

  test('비-UUID receiptId → 400 VALIDATION_ERROR', async ({ request }) => {
    const res = await request.delete(
      `${BASE}/meetings/${GHOST_UUID}/receipts/not-a-uuid`
    );
    expect(res.status()).toBe(400);
    expect((await res.json()).error.code).toBe('VALIDATION_ERROR');
  });

  test('없는 meetingId → 404 MEETING_NOT_FOUND', async ({ request }) => {
    test.skip(!seed['__dbReady'], 'DB 없이 실행 — 404 검증 불가');
    const res = await request.delete(
      `${BASE}/meetings/${GHOST_UUID}/receipts/${GHOST_UUID}`
    );
    expect(res.status()).toBe(404);
    expect((await res.json()).error.code).toBe('MEETING_NOT_FOUND');
  });

  test.describe('무인증', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('→ 403 FORBIDDEN', async ({ request }) => {
      // 모임은 존재해야 auth check에 도달한다 (meeting check → auth check 순서)
      test.skip(!seed['SEEDPAY3'], 'seed 미적용');
      const res = await request.delete(
        `${BASE}/meetings/${seed['SEEDPAY3']}/receipts/${GHOST_UUID}`
      );
      expect(res.status()).toBe(403);
      expect((await res.json()).error.code).toBe('FORBIDDEN');
    });
  });

  test('없는 receiptId → 404 RECEIPT_NOT_FOUND', async ({ request }) => {
    test.skip(!seed['SEEDPAY3'], 'seed 미적용');
    const res = await request.delete(
      `${BASE}/meetings/${seed['SEEDPAY3']}/receipts/${GHOST_UUID}`
    );
    expect(res.status()).toBe(404);
    expect((await res.json()).error.code).toBe('RECEIPT_NOT_FOUND');
  });

  test('SEEDPAY1 (CONFIRMED 정산) → 403 FORBIDDEN', async ({ request }) => {
    test.skip(
      !seed['SEEDPAY1'] || !confirmedReceiptId,
      'seed 미적용 또는 영수증 없음'
    );
    const res = await request.delete(
      `${BASE}/meetings/${seed['SEEDPAY1']}/receipts/${confirmedReceiptId}`
    );
    expect(res.status()).toBe(403);
    expect((await res.json()).error.code).toBe('FORBIDDEN');
  });

  test('SEEDPAY4 (DRAFT 정산) → 409 RECEIPT_LOCKED', async ({ request }) => {
    test.skip(
      !seed['SEEDPAY4'] || !lockedReceiptId,
      'seed 미적용 또는 영수증 없음'
    );
    const res = await request.delete(
      `${BASE}/meetings/${seed['SEEDPAY4']}/receipts/${lockedReceiptId}`
    );
    expect(res.status()).toBe(409);
    expect((await res.json()).error.code).toBe('RECEIPT_LOCKED');
  });

  test('SEEDPAY3 (정산 없음) → 204', async ({ request }) => {
    test.skip(
      !seed['SEEDPAY3'] || !deleteReceiptId,
      'seed 미적용 또는 영수증 생성 실패'
    );
    const res = await request.delete(
      `${BASE}/meetings/${seed['SEEDPAY3']}/receipts/${deleteReceiptId}`
    );
    expect(res.status()).toBe(204);
    deleteReceiptId = null; // afterAll cleanup 불필요 표시
  });
});

// ── POST /meetings/:meetingId/settlements ─────────────────────────────────────
//
// 409 케이스(SEEDPAY1 — 이미 정산 존재)는 데이터 생성 없으므로 멱등.
// 201 케이스(SEEDPAY3)는 afterAll에서 생성된 정산을 삭제해 멱등화.

test.describe('POST /meetings/:meetingId/settlements', () => {
  test.beforeAll(() => {
    seed = loadSeed();
  });

  test.afterAll(async () => {
    if (!seed['SEEDPAY3']) return;
    const prisma = new PrismaClient();
    try {
      await prisma.settlement.deleteMany({
        where: { meetingId: seed['SEEDPAY3'] },
      });
    } finally {
      await prisma.$disconnect();
    }
  });

  test('비-UUID meetingId → 400 VALIDATION_ERROR', async ({ request }) => {
    const res = await request.post(`${BASE}/meetings/not-a-uuid/settlements`, {
      data: { splitMethod: 'EQUAL' },
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).error.code).toBe('VALIDATION_ERROR');
  });

  test('없는 meetingId → 404 MEETING_NOT_FOUND', async ({ request }) => {
    test.skip(!seed['__dbReady'], 'DB 없이 실행 — 404 검증 불가');
    const res = await request.post(
      `${BASE}/meetings/${GHOST_UUID}/settlements`,
      { data: { splitMethod: 'EQUAL' } }
    );
    expect(res.status()).toBe(404);
    expect((await res.json()).error.code).toBe('MEETING_NOT_FOUND');
  });

  test.describe('무인증', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('→ 403 FORBIDDEN', async ({ request }) => {
      test.skip(!seed['SEEDPAY3'], 'seed 미적용');
      const res = await request.post(
        `${BASE}/meetings/${seed['SEEDPAY3']}/settlements`,
        { data: { splitMethod: 'EQUAL' } }
      );
      expect(res.status()).toBe(403);
      expect((await res.json()).error.code).toBe('FORBIDDEN');
    });
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

  test('SEEDPAY3 + EQUAL → 201 + settlement 반환', async ({ request }) => {
    test.skip(!seed['SEEDPAY3'], 'seed 미적용');
    // SEEDPAY3에는 영수증이 없으므로 EQUAL + totalAmount를 직접 제공한다.
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

// ── GET /meetings/:meetingId/settlements/:settlementId/assignments/me ──────────

test.describe('GET /meetings/:meetingId/settlements/:settlementId/assignments/me', () => {
  test.beforeAll(() => {
    seed = loadSeed();
  });

  test('비-UUID 경로 파라미터 → 400 VALIDATION_ERROR', async ({ request }) => {
    const res = await request.get(
      `${BASE}/meetings/not-a-uuid/settlements/not-a-uuid/assignments/me`
    );
    expect(res.status()).toBe(400);
    expect((await res.json()).error.code).toBe('VALIDATION_ERROR');
  });

  test('없는 meetingId → 404 MEETING_NOT_FOUND', async ({ request }) => {
    test.skip(!seed['__dbReady'], 'DB 없이 실행 — 404 검증 불가');
    const res = await request.get(
      `${BASE}/meetings/${GHOST_UUID}/settlements/${GHOST_UUID}/assignments/me`
    );
    expect(res.status()).toBe(404);
    expect((await res.json()).error.code).toBe('MEETING_NOT_FOUND');
  });

  test.describe('무인증', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('→ 403 FORBIDDEN', async ({ request }) => {
      test.skip(
        !seed['SEEDPAY4'] || !seed['SEEDPAY4_SETTLEMENT'],
        'seed 미적용'
      );
      const res = await request.get(
        `${BASE}/meetings/${seed['SEEDPAY4']}/settlements/${seed['SEEDPAY4_SETTLEMENT']}/assignments/me`
      );
      expect(res.status()).toBe(403);
      expect((await res.json()).error.code).toBe('FORBIDDEN');
    });
  });

  test('SEEDPAY4 + 인증 → 200 + role·memberId·nickname 반환', async ({
    request,
  }) => {
    test.skip(!seed['SEEDPAY4'] || !seed['SEEDPAY4_SETTLEMENT'], 'seed 미적용');
    const res = await request.get(
      `${BASE}/meetings/${seed['SEEDPAY4']}/settlements/${seed['SEEDPAY4_SETTLEMENT']}/assignments/me`
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toMatchObject({
      role: expect.stringMatching(/^(HOST|MEMBER)$/),
      memberId: expect.any(String),
      nickname: expect.any(String),
    });
  });
});

// ── PUT /meetings/:meetingId/settlements/:settlementId/assignments/me ──────────
//
// SEEDPAY4는 ITEM_BASED DRAFT 정산을 가진다.
// assertReceiptAddable이 API 경로를 막으므로 beforeAll에서 Prisma로 직접 생성.
// DELETE 섹션 afterAll이 SEEDPAY4 영수증을 정리하므로 여기서는 새로 생성.
// afterAll: 이 섹션이 생성한 SEEDPAY4 영수증 전체 삭제.

test.describe('PUT /meetings/:meetingId/settlements/:settlementId/assignments/me', () => {
  let receiptItemId: string | null = null;

  test.beforeAll(async () => {
    seed = loadSeed();
    if (!seed['SEEDPAY4']) return;

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

      const host = await prisma.meetingMember.findFirst({
        where: { meetingId: seed['SEEDPAY4'], role: 'HOST' },
        select: { id: true },
      });
      const receipt = await prisma.receipt.create({
        data: {
          meetingId: seed['SEEDPAY4'],
          uploadedByMemberId: host?.id,
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

  test('비-UUID 경로 파라미터 → 400 VALIDATION_ERROR', async ({ request }) => {
    const res = await request.put(
      `${BASE}/meetings/not-a-uuid/settlements/not-a-uuid/assignments/me`,
      { data: { receiptItemIds: [GHOST_UUID] } }
    );
    expect(res.status()).toBe(400);
    expect((await res.json()).error.code).toBe('VALIDATION_ERROR');
  });

  test('없는 meetingId → 404 MEETING_NOT_FOUND', async ({ request }) => {
    test.skip(!seed['__dbReady'], 'DB 없이 실행 — 404 검증 불가');
    const res = await request.put(
      `${BASE}/meetings/${GHOST_UUID}/settlements/${GHOST_UUID}/assignments/me`,
      { data: { receiptItemIds: [GHOST_UUID] } }
    );
    expect(res.status()).toBe(404);
    expect((await res.json()).error.code).toBe('MEETING_NOT_FOUND');
  });

  test.describe('무인증', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('→ 403 FORBIDDEN', async ({ request }) => {
      test.skip(
        !seed['SEEDPAY4'] || !seed['SEEDPAY4_SETTLEMENT'],
        'seed 미적용'
      );
      const res = await request.put(
        `${BASE}/meetings/${seed['SEEDPAY4']}/settlements/${seed['SEEDPAY4_SETTLEMENT']}/assignments/me`,
        { data: { receiptItemIds: [GHOST_UUID] } }
      );
      expect(res.status()).toBe(403);
      expect((await res.json()).error.code).toBe('FORBIDDEN');
    });
  });

  test('receiptItemIds 누락 → 400 VALIDATION_ERROR', async ({ request }) => {
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
      'seed 미적용 또는 영수증 없음'
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

// ── POST /meetings/:meetingId/settlements/:settlementId/confirm ────────────────
//
// beforeAll ①: SEEDPAY3에 EQUAL 정산을 API로 생성해 확정 케이스를 준비한다.
//              (POST /settlements 섹션 afterAll이 정산을 삭제한 뒤이므로 재생성 필요.)
// beforeAll ②: SEEDPAY4 SettlementMember를 삭제해 "제출자 없음" 상태를 보장.
//              seed.ts는 DRAFT 정산에도 SettlementMember를 미리 생성하므로 삭제 필요.
//              settlement 상태도 DRAFT로 초기화(이전 실행 잔여 방어).
// afterAll: 생성한 SEEDPAY3 정산을 Prisma로 삭제해 멱등성 유지.

test.describe('POST /meetings/:meetingId/settlements/:settlementId/confirm', () => {
  let confirmSettlementId: string | null = null;

  test.beforeAll(async ({ request }) => {
    seed = loadSeed();
    if (!seed['SEEDPAY3']) return;

    const res = await request.post(
      `${BASE}/meetings/${seed['SEEDPAY3']}/settlements`,
      { data: { splitMethod: 'EQUAL', totalAmount: 30000 } }
    );
    if (res.ok()) {
      const body = await res.json().catch(() => null);
      confirmSettlementId = body?.data?.id ?? null;
    }

    // SEEDPAY4의 SettlementMember를 모두 삭제해 "제출자 없음(attendingCount > memberCount)"
    // 상태를 보장한다. seed.ts는 DRAFT 정산에도 SettlementMember를 미리 생성하고,
    // PUT 섹션 테스트가 항목을 배정하므로, 그대로 두면 confirm이 200(성공)을 반환한다.
    // SEEDPAY4 settlement 상태도 DRAFT로 초기화(이전 실행 잔여 방어).
    if (seed['SEEDPAY4_SETTLEMENT']) {
      const prisma = new PrismaClient();
      try {
        await prisma.settlementMember.deleteMany({
          where: { settlementId: seed['SEEDPAY4_SETTLEMENT'] },
        });
        await prisma.settlement.update({
          where: { id: seed['SEEDPAY4_SETTLEMENT'] },
          data: { status: 'DRAFT', confirmedAt: null },
        });
      } finally {
        await prisma.$disconnect();
      }
    }
  });

  test.afterAll(async () => {
    if (!confirmSettlementId) return;
    const prisma = new PrismaClient();
    try {
      await prisma.settlement.deleteMany({
        where: { id: confirmSettlementId },
      });
    } finally {
      await prisma.$disconnect();
    }
  });

  test('비-UUID meetingId → 400 VALIDATION_ERROR', async ({ request }) => {
    const res = await request.post(
      `${BASE}/meetings/not-a-uuid/settlements/not-a-uuid/confirm`
    );
    expect(res.status()).toBe(400);
    expect((await res.json()).error.code).toBe('VALIDATION_ERROR');
  });

  test('비-UUID settlementId → 400 VALIDATION_ERROR', async ({ request }) => {
    const res = await request.post(
      `${BASE}/meetings/${GHOST_UUID}/settlements/not-a-uuid/confirm`
    );
    expect(res.status()).toBe(400);
    expect((await res.json()).error.code).toBe('VALIDATION_ERROR');
  });

  test.describe('무인증', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('→ 403 FORBIDDEN', async ({ request }) => {
      test.skip(
        !seed['SEEDPAY4'] || !seed['SEEDPAY4_SETTLEMENT'],
        'seed 미적용'
      );
      const res = await request.post(
        `${BASE}/meetings/${seed['SEEDPAY4']}/settlements/${seed['SEEDPAY4_SETTLEMENT']}/confirm`
      );
      expect(res.status()).toBe(403);
      expect((await res.json()).error.code).toBe('FORBIDDEN');
    });
  });

  test('없는 settlementId → 404 SETTLEMENT_NOT_FOUND', async ({ request }) => {
    test.skip(!seed['SEEDPAY4'], 'seed 미적용');
    const res = await request.post(
      `${BASE}/meetings/${seed['SEEDPAY4']}/settlements/${GHOST_UUID}/confirm`
    );
    expect(res.status()).toBe(404);
    expect((await res.json()).error.code).toBe('SETTLEMENT_NOT_FOUND');
  });

  test('SEEDPAY4 (ITEM_BASED, 제출자 없음) → 409 SETTLEMENT_CALCULATION_PENDING', async ({
    request,
  }) => {
    test.skip(!seed['SEEDPAY4'] || !seed['SEEDPAY4_SETTLEMENT'], 'seed 미적용');
    const res = await request.post(
      `${BASE}/meetings/${seed['SEEDPAY4']}/settlements/${seed['SEEDPAY4_SETTLEMENT']}/confirm`
    );
    expect(res.status()).toBe(409);
    expect((await res.json()).error.code).toBe(
      'SETTLEMENT_CALCULATION_PENDING'
    );
  });

  test('SEEDPAY3 EQUAL 정산 → 200 + CONFIRMED', async ({ request }) => {
    test.skip(
      !confirmSettlementId || !seed['SEEDPAY3'],
      'beforeAll 정산 생성 실패'
    );
    const res = await request.post(
      `${BASE}/meetings/${seed['SEEDPAY3']}/settlements/${confirmSettlementId}/confirm`
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toMatchObject({
      settlementId: confirmSettlementId,
      status: 'CONFIRMED',
      confirmedAt: expect.any(String),
    });
  });

  test('이미 CONFIRMED → 200 idempotent', async ({ request }) => {
    test.skip(
      !confirmSettlementId || !seed['SEEDPAY3'],
      'beforeAll 정산 생성 실패'
    );
    const res = await request.post(
      `${BASE}/meetings/${seed['SEEDPAY3']}/settlements/${confirmSettlementId}/confirm`
    );
    expect(res.status()).toBe(200);
    expect((await res.json()).data.status).toBe('CONFIRMED');
  });
});
