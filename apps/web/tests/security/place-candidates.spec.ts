import { test, expect } from '@playwright/test';

const BASE = '/api/v1';

// A-2: 일반 멤버/비인증이 호스트 전용 API 호출
// A-4: 비멤버가 모임 리소스에 접근 (IDOR 방어)

test.describe('장소 후보 — 권한 우회 방어', () => {
  test('A-2: 비인증 사용자가 GET /places/search 호출 → 401', async ({
    request,
  }) => {
    const res = await request.get(`${BASE}/places/search?query=이탈리안`);
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  test('A-2: 비인증 사용자가 POST /place-candidates 호출 → 403', async ({
    request,
  }) => {
    const res = await request.post(
      `${BASE}/meetings/any-meeting-id/place-candidates`,
      {
        data: {
          externalPlaceId: 'test_id',
          name: '테스트 장소',
          lat: '37.4979',
          lng: '127.0276',
        },
      }
    );
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test('A-4: 비멤버가 GET /place-recommendations 접근 → 403', async ({
    request,
  }) => {
    const res = await request.get(
      `${BASE}/meetings/nonexistent-meeting-id/place-recommendations?lat=37.4979&lng=127.0276`
    );
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
  });
});
