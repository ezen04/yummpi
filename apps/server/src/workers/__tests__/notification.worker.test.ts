import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    notification: { upsert: vi.fn(), create: vi.fn() },
  },
}));
vi.mock('../../lib/notifications/sendNotification.js', () => ({
  sendNotificationToUser: vi.fn(),
}));
vi.mock('../../lib/bullmq.js', () => ({
  createBullmqConnection: vi.fn(() => ({})),
}));
vi.mock('bullmq', () => ({ Worker: vi.fn() }));

import { processNotificationJob } from '../notification.worker.js';
import { prisma } from '../../lib/prisma.js';
import { sendNotificationToUser } from '../../lib/notifications/sendNotification.js';

function makeJob(overrides: Record<string, unknown> = {}) {
  return {
    data: {
      userId: 'user-1',
      category: 'SETTLEMENT' as const,
      title: '정산이 시작됐어요',
      body: '테스트 모임 정산을 확인해주세요.',
      url: '/meetings/m1/settlement',
      meetingId: 'm1',
      ...overrides,
    },
  };
}

describe('processNotificationJob — 적재(보관) + 발송(전달) 분리', () => {
  beforeEach(() => vi.clearAllMocks());

  it('dedupeKey 있으면 upsert로 멱등 적재 + 발송 위임', async () => {
    await processNotificationJob(
      makeJob({ dedupeKey: 'vote-confirmed-m1' }) as never
    );

    expect(prisma.notification.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { dedupeKey: 'vote-confirmed-m1' },
        create: expect.objectContaining({
          userId: 'user-1',
          category: 'SETTLEMENT',
          url: '/meetings/m1/settlement',
          meetingId: 'm1',
          dedupeKey: 'vote-confirmed-m1',
        }),
        update: {},
      })
    );
    expect(prisma.notification.create).not.toHaveBeenCalled();
    expect(sendNotificationToUser).toHaveBeenCalledOnce();
  });

  it('dedupeKey 없으면 create로 적재 + 발송 위임', async () => {
    await processNotificationJob(makeJob() as never);

    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          category: 'SETTLEMENT',
          meetingId: 'm1',
        }),
      })
    );
    expect(prisma.notification.upsert).not.toHaveBeenCalled();
    expect(sendNotificationToUser).toHaveBeenCalledOnce();
  });

  it('적재는 발송과 분리 — 전달 실패해도 적재는 이미 수행', async () => {
    vi.mocked(sendNotificationToUser).mockResolvedValue({
      ok: false,
      reason: 'opted_out', // push OFF
    });

    await processNotificationJob(makeJob() as never);

    expect(prisma.notification.create).toHaveBeenCalledOnce();
    expect(sendNotificationToUser).toHaveBeenCalledOnce();
  });

  it('null 옵션(url·meetingId 없음)도 적재된다', async () => {
    await processNotificationJob(
      makeJob({
        url: undefined,
        meetingId: undefined,
        category: 'VOTE',
      }) as never
    );

    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ url: null, meetingId: null }),
      })
    );
  });
});
