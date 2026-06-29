import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';

vi.mock('@/lib/current-member', () => ({
  assertHost: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({
  prisma: { $transaction: vi.fn() },
}));
vi.mock('@/lib/meeting-status', () => ({
  transitionMeetingStatus: vi.fn(),
}));

import { POST } from './route';
import { assertHost } from '@/lib/current-member';
import { prisma } from '@/lib/prisma';
import { transitionMeetingStatus } from '@/lib/meeting-status';

const MEETING_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-000000000020';

type Pay = {
  status: 'PENDING' | 'TRANSFER_REPORTED' | 'PAID' | 'EXEMPT';
} | null;

// $transaction(cb) → cb(tx) 직접 실행. tx.settlement.findUnique로 정산을 주입한다.
function mockTx(settlement: unknown) {
  const tx = {
    settlement: { findUnique: vi.fn().mockResolvedValue(settlement) },
  };
  vi.mocked(prisma.$transaction).mockImplementation(
    // @ts-expect-error 콜백 시그니처만 사용
    async (cb: (t: typeof tx) => unknown) => cb(tx)
  );
  return tx;
}

function settlementWith(payments: Pay[]) {
  return {
    id: 'settlement-1',
    settlementMembers: payments.map((payment) => ({ payment })),
  };
}

function call() {
  const req = new Request('http://test/', {
    method: 'POST',
  }) as unknown as NextRequest;
  return POST(req, { params: Promise.resolve({ meetingId: MEETING_ID }) });
}

describe('POST /payments/complete — 트랜잭션화(#3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assertHost).mockResolvedValue({} as never);
    vi.mocked(transitionMeetingStatus).mockResolvedValue({
      id: MEETING_ID,
      status: 'COMPLETED',
    } as never);
  });

  it('전원 PAID|EXEMPT → 200, 전이가 동일 tx 안에서 실행된다', async () => {
    const tx = mockTx(
      settlementWith([{ status: 'PAID' }, { status: 'EXEMPT' }])
    );

    const res = await call();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.meetingStatus).toBe('COMPLETED');
    // 핵심: 검증 read와 전이가 같은 트랜잭션 클라이언트(tx)를 공유 → 원자적
    expect(tx.settlement.findUnique).toHaveBeenCalled();
    expect(transitionMeetingStatus).toHaveBeenCalledWith(
      MEETING_ID,
      'COMPLETED',
      {
        tx,
        reason: 'PAYMENTS_COMPLETED',
      }
    );
  });

  it('미송금(PENDING) 존재 → 422, 전이 없음(롤백)', async () => {
    mockTx(settlementWith([{ status: 'PAID' }, { status: 'PENDING' }]));

    const res = await call();
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(body.error.code).toBe('PAYMENTS_NOT_COMPLETED');
    expect(transitionMeetingStatus).not.toHaveBeenCalled();
  });

  it('Payment 누락(미초기화 멤버) → 422, 전이 없음', async () => {
    mockTx(settlementWith([{ status: 'PAID' }, null]));

    const res = await call();
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(body.error.code).toBe('PAYMENTS_NOT_COMPLETED');
    expect(transitionMeetingStatus).not.toHaveBeenCalled();
  });

  it('정산 없음 → 404, 전이 없음', async () => {
    mockTx(null);

    const res = await call();
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('SETTLEMENT_NOT_FOUND');
    expect(transitionMeetingStatus).not.toHaveBeenCalled();
  });
});
