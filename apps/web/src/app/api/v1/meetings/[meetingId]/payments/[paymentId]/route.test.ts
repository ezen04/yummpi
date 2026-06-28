import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/current-member', () => ({
  requireMember: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    payment: { findUnique: vi.fn(), update: vi.fn(), findMany: vi.fn() },
  },
}));
vi.mock('@/lib/remind-redis', () => ({
  getRemindState: vi.fn(),
  recordRemind: vi.fn(),
}));
vi.mock('@/lib/payment-reminder-queue', () => ({
  enqueuePaymentReminder: vi.fn(),
}));

import type { NextRequest } from 'next/server';
import { PATCH } from './route';
import { requireMember } from '@/lib/current-member';
import { prisma } from '@/lib/prisma';
import { enqueuePaymentReminder } from '@/lib/payment-reminder-queue';
import type { PaymentAction } from '@yummpi/schemas';

const MEETING_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-000000000010';
const PAYMENT_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-000000000011';
const HOST_MEMBER_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0000000000a1';

type MeetingStatus = 'SETTLING' | 'COMPLETED';
type PaymentStatus = 'PENDING' | 'TRANSFER_REPORTED' | 'PAID' | 'EXEMPT';

function makePayment(
  meetingStatus: MeetingStatus,
  paymentStatus: PaymentStatus
) {
  return {
    id: PAYMENT_ID,
    amount: 10000,
    status: paymentStatus,
    paidAt: null,
    settlementMember: {
      id: 'sm-1',
      memberId: HOST_MEMBER_ID,
      settlement: { meetingId: MEETING_ID, meeting: { status: meetingStatus } },
      member: {
        id: HOST_MEMBER_ID,
        role: 'HOST',
        userId: 'user-1',
        nickname: '지훈',
      },
    },
  };
}

function call(action: PaymentAction, paymentId = PAYMENT_ID) {
  const req = new Request('http://test/', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  }) as unknown as NextRequest;
  return PATCH(req, {
    params: Promise.resolve({ meetingId: MEETING_ID, paymentId }),
  });
}

describe('PATCH /payments/:paymentId — 종료 모임 변경 차단(#2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 호스트 본인으로 인증 (MARK_PAID·REMIND·REPORT_TRANSFER 모두 권한 통과 가능)
    vi.mocked(requireMember).mockResolvedValue({
      id: HOST_MEMBER_ID,
      role: 'HOST',
    } as never);
  });

  it.each<PaymentAction>(['MARK_PAID', 'MARK_PENDING', 'REPORT_TRANSFER'])(
    'COMPLETED 모임에서 %s 시도 → 409 INVALID_MEETING_STATUS_TRANSITION, 변경 없음',
    async (action) => {
      vi.mocked(prisma.payment.findUnique).mockResolvedValue(
        makePayment('COMPLETED', 'PAID') as never
      );

      const res = await call(action);
      const body = await res.json();

      expect(res.status).toBe(409);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_MEETING_STATUS_TRANSITION');
      // 종료 모임은 어떤 mutation도 없어야 한다
      expect(prisma.payment.update).not.toHaveBeenCalled();
    }
  );

  it('COMPLETED 모임에서 REMIND 시도 → 409, 큐 적재 없음', async () => {
    vi.mocked(prisma.payment.findUnique).mockResolvedValue(
      makePayment('COMPLETED', 'PENDING') as never
    );

    const res = await call('REMIND');
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error.code).toBe('INVALID_MEETING_STATUS_TRANSITION');
    expect(enqueuePaymentReminder).not.toHaveBeenCalled();
  });

  it('SETTLING 모임은 가드를 통과한다 (멱등 경로 200, mutation 없음)', async () => {
    // 이미 PAID인 Payment에 MARK_PAID → 멱등 분기(200), update 미호출.
    // COMPLETED 가드가 SETTLING을 막지 않음을 확인하는 양성 대조.
    vi.mocked(prisma.payment.findUnique).mockResolvedValue(
      makePayment('SETTLING', 'PAID') as never
    );
    vi.mocked(prisma.payment.findMany).mockResolvedValue([
      { id: PAYMENT_ID, amount: 10000, status: 'PAID' },
    ] as never);

    const res = await call('MARK_PAID');

    expect(res.status).toBe(200);
    expect(prisma.payment.update).not.toHaveBeenCalled();
  });
});
