import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../prisma.js', () => ({
  prisma: {
    meeting: { updateMany: vi.fn() },
  },
}));

import { expireMeetings, EXPIRABLE_STATUSES } from '../meeting-expiry.js';
import { prisma } from '../prisma.js';

describe('EXPIRABLE_STATUSES', () => {
  it('SETTLING 이전 비종료 상태만 포함한다 (취소 허용 범위)', () => {
    expect([...EXPIRABLE_STATUSES]).toEqual([
      'DRAFT',
      'RECRUITING',
      'VOTING',
      'PLACE_CONFIRMED',
      'IN_PROGRESS',
    ]);
    // 정산 시작 이후·종단 상태는 만료 대상이 아니다.
    expect(EXPIRABLE_STATUSES).not.toContain('SETTLING');
    expect(EXPIRABLE_STATUSES).not.toContain('COMPLETED');
    expect(EXPIRABLE_STATUSES).not.toContain('CANCELLED');
  });
});

describe('expireMeetings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('만료 대상이 있으면 updateMany 건수를 반환한다', async () => {
    vi.mocked(prisma.meeting.updateMany).mockResolvedValue({
      count: 3,
    } as never);

    const now = new Date('2026-06-24T12:00:00.000Z');
    const count = await expireMeetings(now);

    expect(count).toBe(3);
    expect(prisma.meeting.updateMany).toHaveBeenCalledOnce();
  });

  it('where: expiresAt<now & 만료가능 상태 & cancelledAt null, data: CANCELLED+cancelledAt', async () => {
    vi.mocked(prisma.meeting.updateMany).mockResolvedValue({
      count: 0,
    } as never);

    const now = new Date('2026-06-24T12:00:00.000Z');
    await expireMeetings(now);

    expect(prisma.meeting.updateMany).toHaveBeenCalledWith({
      where: {
        expiresAt: { lt: now },
        status: {
          in: [
            'DRAFT',
            'RECRUITING',
            'VOTING',
            'PLACE_CONFIRMED',
            'IN_PROGRESS',
          ],
        },
        cancelledAt: null,
      },
      data: {
        status: 'CANCELLED',
        cancelledAt: now,
      },
    });
  });

  it('만료 대상이 없으면 0을 반환한다 (멱등 — 재스캔해도 안전)', async () => {
    vi.mocked(prisma.meeting.updateMany).mockResolvedValue({
      count: 0,
    } as never);

    const count = await expireMeetings();

    expect(count).toBe(0);
  });

  it('now 미지정 시 현재 시각을 기준으로 한다', async () => {
    vi.mocked(prisma.meeting.updateMany).mockResolvedValue({
      count: 0,
    } as never);

    const before = Date.now();
    await expireMeetings();
    const after = Date.now();

    const arg = vi.mocked(prisma.meeting.updateMany).mock.calls[0][0] as {
      where: { expiresAt: { lt: Date } };
      data: { cancelledAt: Date };
    };
    const usedNow = arg.where.expiresAt.lt.getTime();
    expect(usedNow).toBeGreaterThanOrEqual(before);
    expect(usedNow).toBeLessThanOrEqual(after);
    // where 기준 시각과 data 기록 시각이 동일해야 한다.
    expect(arg.data.cancelledAt.getTime()).toBe(usedNow);
  });
});
