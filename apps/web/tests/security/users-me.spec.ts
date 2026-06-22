import { test, expect } from '@playwright/test';

const BASE = '/api/v1';

// A-1: 비인증 사용자가 계정 단위 API(users/me)에 접근 → 401

// TODO: CI에 AUTH_SECRET 추가(⑤) 또는 current-member.ts try-catch 추가(①) 후 skip 제거
// (AUTH_SECRET 없으면 getServerSession이 401 대신 500을 던질 수 있어 skip 유지)
test.describe.skip('내 정보(users/me) — 권한 우회 방어', () => {
  test('A-1: 비인증 사용자가 GET /users/me 호출 → 401', async ({ request }) => {
    const res = await request.get(`${BASE}/users/me`);
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
});
