import { test, expect } from '@playwright/test';

const BASE = '/api/v1';

/**
 * 예약(reservations) 적대적 회귀 테스트 — ① 영역.
 * e2e/security/README.md 케이스 ID 준수. 401/403/409를 단언하는 회귀 테스트.
 *
 * ⚠️ 전 describe .skip: 인증/세션이 필요한 보안 테스트는 CI에 AUTH_SECRET(⑤) 추가
 *    또는 current-member.ts try-catch(①) 후 skip 해제 (members·place-candidates 동일 정책).
 *    회원/게스트 세션·DB 시드가 필요한 케이스는 test.fixme — 픽스처 도입 후 구현.
 */

// 유효 uuid(존재하지 않는 모임/예약). GET·PATCH·DELETE는 인증을 먼저 검사하므로
// 무인증이면 prisma 쿼리 전에 403으로 차단된다.
const MID = '00000000-0000-4000-8000-000000000000';
const RID = '11111111-1111-4111-8111-111111111111';

// R-1: 무인증이 예약 조회/수정/삭제 → 403 FORBIDDEN (assertHost/requireMember 선검사)
test.describe.skip('예약 — 무인증 접근 차단 (R-1)', () => {
  test('무인증 GET /reservations → 403 FORBIDDEN', async ({ request }) => {
    const res = await request.get(`${BASE}/meetings/${MID}/reservations`);
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  test('무인증 PATCH /reservations/:id (호스트 전용) → 403', async ({
    request,
  }) => {
    const res = await request.patch(
      `${BASE}/meetings/${MID}/reservations/${RID}`,
      { data: { status: 'DONE' } }
    );
    expect(res.status()).toBe(403);
    expect((await res.json()).success).toBe(false);
  });

  test('무인증 DELETE /reservations/:id (호스트 전용) → 403', async ({
    request,
  }) => {
    const res = await request.delete(
      `${BASE}/meetings/${MID}/reservations/${RID}`
    );
    expect(res.status()).toBe(403);
    expect((await res.json()).success).toBe(false);
  });
});

// R-2: 세션/시드 필요 — 픽스처 도입 후 구현
test.describe.skip('예약 — 권한·상태 가드 (R-2, 시드 필요)', () => {
  // 비호스트 회원이 예약 상태 변경 시도 → 403
  test.fixme('비호스트 회원 PATCH status → 403 FORBIDDEN', async () => {});

  // 장소 미확정(confirmedCandidateId null) 모임에 예약 생성 → 409
  test.fixme('확정 전 POST → 409 INVALID_MEETING_STATUS_TRANSITION', async () => {});

  // 이미 예약이 있는 모임에 재생성 → 409
  test.fixme('중복 POST → 409 RESERVATION_ALREADY_EXISTS', async () => {});

  // 타 모임 예약 id로 PATCH → 404
  test.fixme('타 모임 예약 PATCH → 404 RESERVATION_NOT_FOUND', async () => {});
});
