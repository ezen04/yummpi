import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../../prisma.js', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    pushSubscription: { deleteMany: vi.fn() },
  },
}));
vi.mock('../webPush.js', () => ({ sendWebPush: vi.fn() }));
vi.mock('../email.js', () => ({ sendNotificationEmail: vi.fn() }));

import { WebPushError } from 'web-push';
import { sendNotificationToUser } from '../sendNotification.js';
import { prisma } from '../../prisma.js';
import { sendWebPush } from '../webPush.js';
import { sendNotificationEmail } from '../email.js';

const SUB = {
  id: 'sub-1',
  endpoint: 'https://push.example.com',
  p256dhKey: 'p256dh',
  authKey: 'auth',
};

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'tester@example.com',
    pushEnabled: true,
    pushSubscriptions: [] as (typeof SUB)[],
    ...overrides,
  };
}

const PAYLOAD = {
  title: '송금 독촉 알림',
  body: '테스트 모임 — 10,000원 미송금 상태입니다.',
  url: '/meetings/m1/payments',
  category: 'PAYMENT' as const,
  emailFallback: true,
};

describe('sendNotificationToUser', () => {
  beforeEach(() => vi.clearAllMocks());

  it('user 없으면 no_target — 아무것도 발송하지 않는다', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null as never);

    const res = await sendNotificationToUser('user-1', PAYLOAD);

    expect(res).toEqual({ ok: false, reason: 'no_target' });
    expect(sendWebPush).not.toHaveBeenCalled();
    expect(sendNotificationEmail).not.toHaveBeenCalled();
  });

  it('pushEnabled false면 opted_out — 마스터 토글 가드', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(
      makeUser({ pushEnabled: false }) as never
    );

    const res = await sendNotificationToUser('user-1', PAYLOAD);

    expect(res).toEqual({ ok: false, reason: 'opted_out' });
    expect(sendWebPush).not.toHaveBeenCalled();
    expect(sendNotificationEmail).not.toHaveBeenCalled();
  });

  it('웹푸시 성공 시 push 채널 반환 · 메일 미발송', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(
      makeUser({ pushSubscriptions: [SUB] }) as never
    );
    vi.mocked(sendWebPush).mockResolvedValue(undefined);

    const res = await sendNotificationToUser('user-1', PAYLOAD);

    expect(res).toEqual({ ok: true, channel: 'push' });
    expect(sendWebPush).toHaveBeenCalledOnce();
    expect(sendNotificationEmail).not.toHaveBeenCalled();
  });

  it('구독 없음 + emailFallback=true + 이메일 있으면 메일 발송', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(makeUser() as never);

    const res = await sendNotificationToUser('user-1', PAYLOAD);

    expect(res).toEqual({ ok: true, channel: 'email' });
    expect(sendNotificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'tester@example.com',
        title: PAYLOAD.title,
      })
    );
    expect(sendWebPush).not.toHaveBeenCalled();
  });

  it('웹푸시 전부 실패 + emailFallback=true → 메일 fallback', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(
      makeUser({ pushSubscriptions: [SUB] }) as never
    );
    vi.mocked(sendWebPush).mockRejectedValue(new Error('push failed'));

    const res = await sendNotificationToUser('user-1', PAYLOAD);

    expect(res).toEqual({ ok: true, channel: 'email' });
    expect(sendWebPush).toHaveBeenCalledOnce();
    expect(sendNotificationEmail).toHaveBeenCalledOnce();
  });

  it('웹푸시 410(만료) → 해당 구독 삭제 + emailFallback로 메일', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(
      makeUser({ pushSubscriptions: [SUB] }) as never
    );
    vi.mocked(sendWebPush).mockRejectedValue(
      new WebPushError('Gone', 410, {}, '', SUB.endpoint)
    );

    const res = await sendNotificationToUser('user-1', PAYLOAD);

    expect(res).toEqual({ ok: true, channel: 'email' });
    expect(prisma.pushSubscription.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: [SUB.id] } },
    });
    expect(sendNotificationEmail).toHaveBeenCalledOnce();
  });

  it('웹푸시 500(일시 오류) → 구독 보존(삭제 안 함)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(
      makeUser({ pushSubscriptions: [SUB] }) as never
    );
    vi.mocked(sendWebPush).mockRejectedValue(
      new WebPushError('Server Error', 500, {}, '', SUB.endpoint)
    );

    const res = await sendNotificationToUser('user-1', PAYLOAD);

    expect(res).toEqual({ ok: true, channel: 'email' });
    expect(prisma.pushSubscription.deleteMany).not.toHaveBeenCalled();
  });

  it('emailFallback=false면 푸시 실패해도 메일 없이 no_channel (독촉 외 카테고리)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(
      makeUser({ pushSubscriptions: [SUB] }) as never
    );
    vi.mocked(sendWebPush).mockRejectedValue(new Error('push failed'));

    const res = await sendNotificationToUser('user-1', {
      ...PAYLOAD,
      category: 'VOTE',
      emailFallback: false,
    });

    expect(res).toEqual({ ok: false, reason: 'no_channel' });
    expect(sendNotificationEmail).not.toHaveBeenCalled();
  });

  it('구독 없음 + emailFallback=false → no_channel', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(makeUser() as never);

    const res = await sendNotificationToUser('user-1', {
      ...PAYLOAD,
      emailFallback: false,
    });

    expect(res).toEqual({ ok: false, reason: 'no_channel' });
    expect(sendWebPush).not.toHaveBeenCalled();
    expect(sendNotificationEmail).not.toHaveBeenCalled();
  });
});
