import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';

vi.mock('@/lib/current-member', () => ({
  assertHost: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    meeting: { findUnique: vi.fn() },
    settlement: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { POST } from './route';
import { assertHost } from '@/lib/current-member';
import { prisma } from '@/lib/prisma';

const MEETING_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-000000000030';
const SETTLEMENT_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-000000000031';

function call() {
  return POST(
    new Request('http://test/', { method: 'POST' }) as unknown as NextRequest,
    { params: Promise.resolve({ meetingId: MEETING_ID, settlementId: SETTLEMENT_ID }) }
  );
}

// $transaction(cb) → cb(tx) 직접 실행
function makeTx({
  lockedStatus = 'DRAFT',
  attendingCount = 2,
  memberCount = 2,
}: { lockedStatus?: string; attendingCount?: number; memberCount?: number } = {}) {
  const updated = { id: SETTLEMENT_ID, status: 'CONFIRMED', confirmedAt: new Date() };
  const tx = {
    $executeRaw: vi.fn().mockResolvedValue(1),
    settlement: {
      findUnique: vi.fn().mockResolvedValue({ id: SETTLEMENT_ID, status: lockedStatus, confirmedAt: null }),
      update: vi.fn().mockResolvedValue(updated),
    },
    meetingMember: { count: vi.fn().mockResolvedValue(attendingCount) },
    settlementMember: { count: vi.fn().mockResolvedValue(memberCount) },
  };
  vi.mocked(prisma.$transaction).mockImplementation(
    // @ts-expect-error 콜백 시그니처만 사용
    async (cb: (t: typeof tx) => unknown) => cb(tx)
  );
  return tx;
}

describe('POST /settlements/:settlementId/confirm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assertHost).mockResolvedValue({} as never);
    vi.mocked(prisma.meeting.findUnique).mockResolvedValue(
      { id: MEETING_ID, status: 'SETTLING' } as never
    );
    vi.mocked(prisma.settlement.findUnique).mockResolvedValue(
      { id: SETTLEMENT_ID, meetingId: MEETING_ID, status: 'DRAFT', confirmedAt: null } as never
    );
  });

  it('DRAFT → 200, settlement CONFIRMED로 업데이트', async () => {
    const tx = makeTx();

    const res = await call();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('CONFIRMED');
    expect(tx.settlement.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'CONFIRMED' }) })
    );
  });

  it('이미 CONFIRMED → 200 idempotent, 트랜잭션 미진입', async () => {
    vi.mocked(prisma.settlement.findUnique).mockResolvedValue(
      { id: SETTLEMENT_ID, meetingId: MEETING_ID, status: 'CONFIRMED', confirmedAt: new Date() } as never
    );

    const res = await call();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.status).toBe('CONFIRMED');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('이미 COMPLETED → 200 idempotent, 트랜잭션 미진입', async () => {
    vi.mocked(prisma.settlement.findUnique).mockResolvedValue(
      { id: SETTLEMENT_ID, meetingId: MEETING_ID, status: 'COMPLETED', confirmedAt: new Date() } as never
    );

    const res = await call();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.status).toBe('COMPLETED');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('모임 없음 → 404 MEETING_NOT_FOUND', async () => {
    vi.mocked(prisma.meeting.findUnique).mockResolvedValue(null);

    const res = await call();
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('MEETING_NOT_FOUND');
  });

  it('모임이 SETTLING 아님 → 409 INVALID_MEETING_STATUS_TRANSITION', async () => {
    vi.mocked(prisma.meeting.findUnique).mockResolvedValue(
      { id: MEETING_ID, status: 'IN_PROGRESS' } as never
    );

    const res = await call();
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error.code).toBe('INVALID_MEETING_STATUS_TRANSITION');
  });

  it('정산 없음 → 404 SETTLEMENT_NOT_FOUND', async () => {
    vi.mocked(prisma.settlement.findUnique).mockResolvedValue(null);

    const res = await call();
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('SETTLEMENT_NOT_FOUND');
  });

  it('정산이 다른 모임 소속 → 404 SETTLEMENT_NOT_FOUND', async () => {
    vi.mocked(prisma.settlement.findUnique).mockResolvedValue(
      { id: SETTLEMENT_ID, meetingId: 'other-meeting-id', status: 'DRAFT', confirmedAt: null } as never
    );

    const res = await call();
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('SETTLEMENT_NOT_FOUND');
  });

  it('참석자 0명 → 400 VALIDATION_ERROR', async () => {
    makeTx({ attendingCount: 0 });

    const res = await call();
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('미제출 멤버 존재 (attendingCount ≠ memberCount) → 409 SETTLEMENT_CALCULATION_PENDING', async () => {
    makeTx({ attendingCount: 3, memberCount: 2 });

    const res = await call();
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error.code).toBe('SETTLEMENT_CALCULATION_PENDING');
  });

  it('TOCTOU: tx 재확인 후 CONFIRMED → 200 idempotent, update 미호출', async () => {
    const tx = makeTx({ lockedStatus: 'CONFIRMED' });

    const res = await call();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.status).toBe('CONFIRMED');
    expect(tx.settlement.update).not.toHaveBeenCalled();
  });
});
