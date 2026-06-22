import { test, expect } from '@playwright/test';

const BASE = '/api/v1';

/**
 * 참석자(members) + 클론(clone) 적대적 회귀 테스트 — ① 영역.
 * e2e/security/README.md 케이스 ID 준수. 일회성 공격이 아니라 401/403/409를
 * 단언하는 회귀 테스트로 작성한다.
 *
 * ⚠️ 전 describe .skip: 인증/세션이 필요한 보안 테스트는 CI에 AUTH_SECRET(⑤)
 *    추가 또는 current-member.ts try-catch(①) 후 skip 해제 (place-candidates 와 동일 정책).
 *    회원/게스트 세션·DB 시드가 필요한 케이스는 test.fixme 로 표시 — 픽스처 도입 후 구현.
 */

const MID = 'any-meeting-id';
const MEMBER = 'any-member-id';

// A-1 / A-2: 무인증 사용자가 참석자 API 호출 → 401/403
test.describe.skip('참석자 — 무인증 접근 차단 (A-1·A-2)', () => {
  test('A-1: 무인증이 GET /members 목록 조회 → 403 FORBIDDEN', async ({
    request,
  }) => {
    const res = await request.get(`${BASE}/meetings/${MID}/members`);
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  test('무인증이 POST /members 참여 → 401 UNAUTHORIZED', async ({
    request,
  }) => {
    const res = await request.post(`${BASE}/meetings/${MID}/members`, {
      data: { inviteCode: 'XXXXXXXX', nickname: '공격자' },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  test('A-2: 무인증이 POST check-in (호스트 전용) → 403', async ({
    request,
  }) => {
    const res = await request.post(
      `${BASE}/meetings/${MID}/members/${MEMBER}/check-in`,
      { data: { checkedIn: true } }
    );
    expect(res.status()).toBe(403);
    expect((await res.json()).success).toBe(false);
  });

  test('A-2: 무인증이 DELETE /members/:id (내보내기) → 403', async ({
    request,
  }) => {
    const res = await request.delete(
      `${BASE}/meetings/${MID}/members/${MEMBER}`
    );
    expect(res.status()).toBe(403);
    expect((await res.json()).success).toBe(false);
  });

  test('무인증이 PATCH /members/:id → 403', async ({ request }) => {
    const res = await request.patch(
      `${BASE}/meetings/${MID}/members/${MEMBER}`,
      { data: { nickname: '바뀐닉' } }
    );
    expect(res.status()).toBe(403);
    expect((await res.json()).success).toBe(false);
  });

  test('C-1: 무인증이 POST /clone (호스트 전용) → 403', async ({ request }) => {
    const res = await request.post(`${BASE}/meetings/${MID}/clone`);
    expect(res.status()).toBe(403);
    expect((await res.json()).success).toBe(false);
  });
});

// 회원/게스트 세션·DB 시드 필요 (H-1·A-3·A-4·S-1·S-4·P-1·A-5) — 픽스처 후 구현
test.describe.skip('참석자 — 세션·시드 필요 (fixme)', () => {
  test.fixme('H-1: 호스트가 자기 자신 DELETE → 403 (호스트 불변식)', () => {});
  test.fixme('A-3: 게스트 토큰으로 check-in 호출 → 403', () => {});
  test.fixme('A-4: 다른 모임 memberId 로 PATCH/DELETE/check-in (IDOR) → 403/404', () => {});
  test.fixme('S-1: 닉네임 초장문(>20)/제어문자 PATCH → 400 VALIDATION_ERROR', () => {});
  test.fixme('S-4: 정원 초과 모임 POST /members → 409 MEETING_CAPACITY_EXCEEDED', () => {});
  test.fixme('P-1: 일반 멤버가 타인 memberId PATCH (본인만) → 403', () => {});
  test.fixme('A-5: 만료 모임 POST /members → 409 MEETING_EXPIRED', () => {});
});

// 클론 동작 정합성 — DB 조회 필요 (test.fixme)
test.describe.skip('클론 — 동작 정합성 (C-2·C-3)', () => {
  test.fixme('C-2: 클론 시 게스트/퇴장자 미복사 (회원만 승계)', () => {});
  test.fixme('C-3: seriesId 체이닝 스탬프 (source.seriesId ?? source.id)', () => {});
});
