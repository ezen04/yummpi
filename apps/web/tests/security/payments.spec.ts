import { test, expect } from '@playwright/test';

const BASE = '/api/v1';
const MID = 'any-meeting-id';
const PID = 'any-payment-id';

/**
 * 송금(payments) 보안 테스트.
 * requireMember → 무인증 401, 비참여자 403.
 * assertHost → 비호스트 403.
 *
 * ⚠️ AUTH_SECRET 미설정 시 getServerSession이 401 대신 500을 던짐.
 *    CI에 AUTH_SECRET 시크릿 추가(⑤) 또는 current-member.ts try-catch ���가(①) 후 skip 해제.
 */

// 무인증 접근 — AUTH_SECRET 필요
test.describe.skip('송금 — 무인증 접근 차단', () => {
  test('무인증 GET /payments → 401 UNAUTHORIZED', async ({ request }) => {
    const res = await request.get(`${BASE}/meetings/${MID}/payments`);
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  test('무인증 PATCH /payments/:id → 401 UNAUTHORIZED', async ({ request }) => {
    const res = await request.patch(
      `${BASE}/meetings/${MID}/payments/${PID}`,
      { data: { action: 'MARK_PAID' } }
    );
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
});

// 인증·시드 필요 — 픽스처 도입 후 구현
test.describe.skip('송금 — 세션·시드 필��� (fixme)', () => {
  test.fixme('비참여자가 GET /payments → 403 FORBIDDEN', () => {});
  test.fixme('일반 멤버가 MARK_PAID → 403 FORBIDDEN', () => {});
  test.fixme(
    '주최자 본인 Payment에 MARK_PENDING → 409 INVALID_PAYMENT_STATUS',
    () => {}
  );
  test.fixme('비참여자가 PATCH /payments/:id → 403 FORBIDDEN', () => {});
});
