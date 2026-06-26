import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    notification: { create: vi.fn() },
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

const P2002 = new Prisma.PrismaClientKnownRequestError(
  'Unique constraint failed',
  { code: 'P2002', clientVersion: '6.19.0' }
);

function makeJob(overrides: Record<string, unknown> = {}, id?: string) {
  return {
    ...(id ? { id } : {}),
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

describe('processNotificationJob — 멱등 적재 + 최초 1회 발송', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.notification.create).mockResolvedValue({} as never);
    vi.mocked(sendNotificationToUser).mockResolvedValue({
      ok: true,
      channel: 'push',
    });
  });

  it('dedupeKey로 1회 create 적재 + 발송', async () => {
    await processNotificationJob(
      makeJob({ dedupeKey: 'vote-confirmed-m1' }) as never
    );

    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          category: 'SETTLEMENT',
          url: '/meetings/m1/settlement',
          meetingId: 'm1',
          dedupeKey: 'vote-confirmed-m1',
        }),
      })
    );
    expect(sendNotificationToUser).toHaveBeenCalledOnce();
  });

  it('dedupeKey 없으면 job.id를 fallback 멱등 키로 사용', async () => {
    await processNotificationJob(makeJob({}, 'bull-7') as never);

    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ dedupeKey: 'job-bull-7' }),
      })
    );
    expect(sendNotificationToUser).toHaveBeenCalledOnce();
  });

  it('dedupeKey·job.id 둘 다 없으면 dedupeKey=null로 create (예외 경로)', async () => {
    await processNotificationJob(makeJob() as never);

    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ dedupeKey: null }),
      })
    );
    expect(sendNotificationToUser).toHaveBeenCalledOnce();
  });

  it('이미 존재(P2002)면 발송 skip — 중복 푸시/메일 방지', async () => {
    vi.mocked(prisma.notification.create).mockRejectedValueOnce(P2002);

    await processNotificationJob(
      makeJob({ dedupeKey: 'vote-confirmed-m1' }) as never
    );

    expect(sendNotificationToUser).not.toHaveBeenCalled();
  });

  it('P2002 외 DB 에러는 rethrow (잡 실패 → 재시도)', async () => {
    vi.mocked(prisma.notification.create).mockRejectedValueOnce(
      new Error('db down')
    );

    await expect(
      processNotificationJob(makeJob({ dedupeKey: 'k' }) as never)
    ).rejects.toThrow('db down');
    expect(sendNotificationToUser).not.toHaveBeenCalled();
  });

  it('최초 생성이면 전달 결과와 무관하게 적재는 수행', async () => {
    vi.mocked(sendNotificationToUser).mockResolvedValue({
      ok: false,
      reason: 'opted_out', // push OFF
    });

    await processNotificationJob(makeJob() as never);

    expect(prisma.notification.create).toHaveBeenCalledOnce();
    expect(sendNotificationToUser).toHaveBeenCalledOnce();
  });

  it('url·meetingId 없으면 null로 적재', async () => {
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
