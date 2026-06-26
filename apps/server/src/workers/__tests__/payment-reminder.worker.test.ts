import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    payment: { findUnique: vi.fn() },
    meeting: { findUnique: vi.fn() },
    notification: { upsert: vi.fn() },
  },
}));
vi.mock('../../lib/notifications/sendNotification.js', () => ({
  sendNotificationToUser: vi.fn(),
}));
vi.mock('../../lib/bullmq.js', () => ({
  createBullmqConnection: vi.fn(() => ({})),
}));
vi.mock('bullmq', () => ({ Worker: vi.fn() }));

import { processReminderJob } from '../payment-reminder.worker.js';
import { prisma } from '../../lib/prisma.js';
import { sendNotificationToUser } from '../../lib/notifications/sendNotification.js';

// 기본 payment 픽스처 — 각 테스트에서 필요한 필드만 덮어쓴다.
// 푸시/메일 분기는 sendNotificationToUser(헬퍼) 테스트가 담당하므로
// worker 테스트는 "위임 여부 + 도메인 skip 분기"만 본다.
function makePayment(overrides: Record<string, unknown> = {}) {
  return {
    id: 'payment-1',
    status: 'PENDING',
    amount: 10000,
    ...overrides,
    settlementMember: {
      settlement: { meetingId: 'meeting-1' },
      member: {
        userId: 'user-1',
        nickname: '테스터',
        user: {
          id: 'user-1',
          paymentReminderEnabled: true,
        },
      },
      ...((overrides.settlementMember as Record<string, unknown>) ?? {}),
    },
  };
}

function makeJob(targetUserId = 'user-1', sequence = 1) {
  return {
    data: {
      meetingId: 'meeting-1',
      paymentId: 'payment-1',
      targetUserId,
      sequence,
    },
  };
}

describe('processReminderJob — skip 분기 (발송 위임 안 함)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.meeting.findUnique).mockResolvedValue({
      title: '테스트 모임',
    } as never);
  });

  it('payment 없으면 skip', async () => {
    vi.mocked(prisma.payment.findUnique).mockResolvedValue(null);
    await processReminderJob(makeJob());
    expect(sendNotificationToUser).not.toHaveBeenCalled();
  });

  it('status가 PENDING이 아니면 skip', async () => {
    vi.mocked(prisma.payment.findUnique).mockResolvedValue(
      makePayment({ status: 'PAID' }) as never
    );
    await processReminderJob(makeJob());
    expect(sendNotificationToUser).not.toHaveBeenCalled();
  });

  it('게스트(userId === null)이면 skip', async () => {
    const payment = makePayment();
    payment.settlementMember.member.userId = null as never;
    vi.mocked(prisma.payment.findUnique).mockResolvedValue(payment as never);
    await processReminderJob(makeJob());
    expect(sendNotificationToUser).not.toHaveBeenCalled();
  });

  it('targetUserId 불일치이면 skip', async () => {
    vi.mocked(prisma.payment.findUnique).mockResolvedValue(
      makePayment() as never
    );
    await processReminderJob(makeJob('other-user'));
    expect(sendNotificationToUser).not.toHaveBeenCalled();
  });

  it('paymentReminderEnabled false이면 skip (카테고리 토글)', async () => {
    const payment = makePayment();
    payment.settlementMember.member.user.paymentReminderEnabled = false;
    vi.mocked(prisma.payment.findUnique).mockResolvedValue(payment as never);
    await processReminderJob(makeJob());
    expect(sendNotificationToUser).not.toHaveBeenCalled();
  });
});

describe('processReminderJob — 헬퍼 위임', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.meeting.findUnique).mockResolvedValue({
      title: '테스트 모임',
    } as never);
  });

  it('PENDING 본인 회원이면 sendNotificationToUser에 PAYMENT 알림을 위임한다', async () => {
    vi.mocked(prisma.payment.findUnique).mockResolvedValue(
      makePayment() as never
    );

    await processReminderJob(makeJob());

    expect(sendNotificationToUser).toHaveBeenCalledOnce();
    expect(sendNotificationToUser).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        category: 'PAYMENT',
        emailFallback: true,
        url: '/meetings/meeting-1/payments',
        meetingId: 'meeting-1',
      })
    );
  });

  it('금액·모임명이 본문에 반영된다', async () => {
    vi.mocked(prisma.payment.findUnique).mockResolvedValue(
      makePayment({ amount: 23000 }) as never
    );

    await processReminderJob(makeJob());

    expect(sendNotificationToUser).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        body: '테스트 모임 — 23,000원 미송금 상태입니다.',
      })
    );
  });
});

describe('processReminderJob — 인앱 알림함 적재 (발송과 분리·멱등)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.meeting.findUnique).mockResolvedValue({
      title: '테스트 모임',
    } as never);
  });

  it('회차(sequence)별 dedupeKey로 notifications row를 upsert 적재한다', async () => {
    vi.mocked(prisma.payment.findUnique).mockResolvedValue(
      makePayment() as never
    );

    await processReminderJob(makeJob('user-1', 2));

    expect(prisma.notification.upsert).toHaveBeenCalledOnce();
    expect(prisma.notification.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { dedupeKey: 'remind-payment-1-2' },
        create: expect.objectContaining({
          userId: 'user-1',
          category: 'PAYMENT',
          url: '/meetings/meeting-1/payments',
          meetingId: 'meeting-1',
          dedupeKey: 'remind-payment-1-2',
        }),
        update: {},
      })
    );
  });

  it('적재는 발송 전에·발송 결과와 무관하게 실행된다 (전달 실패해도 적재됨)', async () => {
    vi.mocked(prisma.payment.findUnique).mockResolvedValue(
      makePayment() as never
    );
    // 전달 실패(예: 구독 없음/푸시 OFF) 시뮬레이션
    vi.mocked(sendNotificationToUser).mockResolvedValue({
      ok: false,
      reason: 'no_channel',
    });

    await processReminderJob(makeJob());

    expect(prisma.notification.upsert).toHaveBeenCalledOnce();
    expect(sendNotificationToUser).toHaveBeenCalledOnce();
  });

  it('게이트(paymentReminderEnabled off)에 막히면 적재도 안 한다', async () => {
    const payment = makePayment();
    payment.settlementMember.member.user.paymentReminderEnabled = false;
    vi.mocked(prisma.payment.findUnique).mockResolvedValue(payment as never);

    await processReminderJob(makeJob());

    expect(prisma.notification.upsert).not.toHaveBeenCalled();
    expect(sendNotificationToUser).not.toHaveBeenCalled();
  });
});
