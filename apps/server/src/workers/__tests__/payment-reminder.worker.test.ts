import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    payment: { findUnique: vi.fn() },
    meeting: { findUnique: vi.fn() },
  },
}));
vi.mock('../../lib/notifications/webPush.js', () => ({
  sendWebPush: vi.fn(),
}));
vi.mock('../../lib/notifications/email.js', () => ({
  sendPaymentReminderEmail: vi.fn(),
}));
vi.mock('../../lib/bullmq.js', () => ({
  createBullmqConnection: vi.fn(() => ({})),
}));
vi.mock('bullmq', () => ({ Worker: vi.fn() }));

import { processReminderJob } from '../payment-reminder.worker.js';
import { prisma } from '../../lib/prisma.js';
import { sendWebPush } from '../../lib/notifications/webPush.js';
import { sendPaymentReminderEmail } from '../../lib/notifications/email.js';

// 기본 payment 픽스처 — 각 테스트에서 필요한 필드만 덮어쓴다
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
          email: 'tester@example.com',
          pushEnabled: true,
          paymentReminderEnabled: true,
          pushSubscriptions: [] as {
            id: string;
            endpoint: string;
            p256dhKey: string;
            authKey: string;
          }[],
        },
      },
      ...((overrides.settlementMember as Record<string, unknown>) ?? {}),
    },
  };
}

function makeJob(targetUserId = 'user-1') {
  return {
    data: { meetingId: 'meeting-1', paymentId: 'payment-1', targetUserId },
  };
}

describe('processReminderJob — skip 분기', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.meeting.findUnique).mockResolvedValue({
      title: '테스트 모임',
    } as never);
  });

  it('payment 없으면 알림을 보내지 않는다', async () => {
    vi.mocked(prisma.payment.findUnique).mockResolvedValue(null);

    await processReminderJob(makeJob());

    expect(sendWebPush).not.toHaveBeenCalled();
    expect(sendPaymentReminderEmail).not.toHaveBeenCalled();
  });

  it('status가 PENDING이 아니면 skip', async () => {
    vi.mocked(prisma.payment.findUnique).mockResolvedValue(
      makePayment({ status: 'PAID' }) as never
    );

    await processReminderJob(makeJob());

    expect(sendWebPush).not.toHaveBeenCalled();
    expect(sendPaymentReminderEmail).not.toHaveBeenCalled();
  });

  it('게스트(userId === null)이면 skip', async () => {
    const payment = makePayment();
    payment.settlementMember.member.userId = null as never;
    vi.mocked(prisma.payment.findUnique).mockResolvedValue(payment as never);

    await processReminderJob(makeJob());

    expect(sendWebPush).not.toHaveBeenCalled();
    expect(sendPaymentReminderEmail).not.toHaveBeenCalled();
  });

  it('targetUserId 불일치이면 skip', async () => {
    vi.mocked(prisma.payment.findUnique).mockResolvedValue(
      makePayment() as never
    );

    await processReminderJob(makeJob('other-user'));

    expect(sendWebPush).not.toHaveBeenCalled();
    expect(sendPaymentReminderEmail).not.toHaveBeenCalled();
  });

  it('pushEnabled false이면 skip', async () => {
    const payment = makePayment();
    payment.settlementMember.member.user.pushEnabled = false;
    vi.mocked(prisma.payment.findUnique).mockResolvedValue(payment as never);

    await processReminderJob(makeJob());

    expect(sendWebPush).not.toHaveBeenCalled();
    expect(sendPaymentReminderEmail).not.toHaveBeenCalled();
  });

  it('paymentReminderEnabled false이면 skip', async () => {
    const payment = makePayment();
    payment.settlementMember.member.user.paymentReminderEnabled = false;
    vi.mocked(prisma.payment.findUnique).mockResolvedValue(payment as never);

    await processReminderJob(makeJob());

    expect(sendWebPush).not.toHaveBeenCalled();
    expect(sendPaymentReminderEmail).not.toHaveBeenCalled();
  });
});

describe('processReminderJob — 알림 발송', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.meeting.findUnique).mockResolvedValue({
      title: '테스트 모임',
    } as never);
  });

  it('구독 없고 이메일 있으면 이메일 발송', async () => {
    vi.mocked(prisma.payment.findUnique).mockResolvedValue(
      makePayment() as never
    );

    await processReminderJob(makeJob());

    expect(sendPaymentReminderEmail).toHaveBeenCalledOnce();
    expect(sendPaymentReminderEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'tester@example.com', amount: 10000 })
    );
    expect(sendWebPush).not.toHaveBeenCalled();
  });

  it('웹푸시 성공 시 이메일 미발송', async () => {
    const payment = makePayment();
    payment.settlementMember.member.user.pushSubscriptions = [
      {
        id: 'sub-1',
        endpoint: 'https://push.example.com',
        p256dhKey: 'p256dh',
        authKey: 'auth',
      },
    ];
    vi.mocked(prisma.payment.findUnique).mockResolvedValue(payment as never);
    vi.mocked(sendWebPush).mockResolvedValue(undefined);

    await processReminderJob(makeJob());

    expect(sendWebPush).toHaveBeenCalledOnce();
    expect(sendPaymentReminderEmail).not.toHaveBeenCalled();
  });

  it('웹푸시 전부 실패 시 이메일 fallback', async () => {
    const payment = makePayment();
    payment.settlementMember.member.user.pushSubscriptions = [
      {
        id: 'sub-1',
        endpoint: 'https://push.example.com',
        p256dhKey: 'p256dh',
        authKey: 'auth',
      },
    ];
    vi.mocked(prisma.payment.findUnique).mockResolvedValue(payment as never);
    vi.mocked(sendWebPush).mockRejectedValue(new Error('push failed'));

    await processReminderJob(makeJob());

    expect(sendWebPush).toHaveBeenCalledOnce();
    expect(sendPaymentReminderEmail).toHaveBeenCalledOnce();
  });

  it('이메일도 없으면 아무것도 보내지 않는다', async () => {
    const payment = makePayment();
    payment.settlementMember.member.user.email = null as never;
    vi.mocked(prisma.payment.findUnique).mockResolvedValue(payment as never);

    await processReminderJob(makeJob());

    expect(sendWebPush).not.toHaveBeenCalled();
    expect(sendPaymentReminderEmail).not.toHaveBeenCalled();
  });
});
