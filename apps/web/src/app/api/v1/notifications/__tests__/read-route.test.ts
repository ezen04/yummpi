import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/current-member', () => ({
  requireUser: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    notification: { updateMany: vi.fn(), findFirst: vi.fn() },
  },
}));

import { PATCH } from '../[id]/read/route';
import { requireUser } from '@/lib/current-member';
import { prisma } from '@/lib/prisma';

const VALID_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-000000000001'; // v4(버전4·variant8) 유효 UUID

function call(id: string) {
  return PATCH(new Request('http://test/'), {
    params: Promise.resolve({ id }),
  });
}

describe('PATCH /notifications/:id/read', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireUser).mockResolvedValue({ id: 'user-1' } as never);
  });

  it('본인 안 읽음 알림이면 읽음 처리하고 성공한다', async () => {
    vi.mocked(prisma.notification.updateMany).mockResolvedValue({
      count: 1,
    } as never);

    const res = await call(VALID_ID);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    // 보안 핵심: 갱신은 항상 본인(userId) 스코프로만 — 타인 알림 불가침
    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { id: VALID_ID, userId: 'user-1', readAt: null },
      data: { readAt: expect.any(Date) },
    });
  });

  it('타인 소유/존재하지 않으면 404 (cross-user 격리)', async () => {
    // 본인 스코프 updateMany 0건 + 본인 스코프 findFirst도 null → 내 알림 아님
    vi.mocked(prisma.notification.updateMany).mockResolvedValue({
      count: 0,
    } as never);
    vi.mocked(prisma.notification.findFirst).mockResolvedValue(null as never);

    const res = await call(VALID_ID);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('NOTIFICATION_NOT_FOUND');
  });

  it('본인의 이미 읽은 알림이면 멱등 성공(200)', async () => {
    vi.mocked(prisma.notification.updateMany).mockResolvedValue({
      count: 0,
    } as never);
    vi.mocked(prisma.notification.findFirst).mockResolvedValue({
      id: VALID_ID,
    } as never);

    const res = await call(VALID_ID);

    expect(res.status).toBe(200);
  });

  it('UUID 형식이 아니면 400', async () => {
    const res = await call('not-a-uuid');
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(prisma.notification.updateMany).not.toHaveBeenCalled();
  });
});
