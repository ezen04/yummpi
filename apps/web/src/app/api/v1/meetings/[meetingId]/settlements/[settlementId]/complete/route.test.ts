import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';
import { ApiError } from '@/lib/api-response';

vi.mock('@/lib/current-member', () => ({
  assertHost: vi.fn(),
}));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    settlement: { findUnique: vi.fn(), update: vi.fn() },
  },
}));

import { POST } from './route';
import { assertHost } from '@/lib/current-member';
import { prisma } from '@/lib/prisma';

const MEETING_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-000000000040';
const SETTLEMENT_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-000000000041';
const COMPLETED_AT = new Date('2026-07-02T00:00:00.000Z');

function call() {
  return POST(
    new Request('http://test/', { method: 'POST' }) as unknown as NextRequest,
    {
      params: Promise.resolve({
        meetingId: MEETING_ID,
        settlementId: SETTLEMENT_ID,
      }),
    }
  );
}

function makeSettlement({
  status = 'CONFIRMED',
  meetingId = MEETING_ID,
  completedAt = null as Date | null,
} = {}) {
  return { id: SETTLEMENT_ID, meetingId, status, completedAt };
}

describe('POST /settlements/:settlementId/complete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assertHost).mockResolvedValue({} as never);
    vi.mocked(prisma.settlement.findUnique).mockResolvedValue(
      makeSettlement() as never
    );
    vi.mocked(prisma.settlement.update).mockResolvedValue({
      id: SETTLEMENT_ID,
      completedAt: COMPLETED_AT,
    } as never);
  });

  it('CONFIRMED + completedAt 없음 → 200, completedAt 신규 기록', async () => {
    const res = await call();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.settlementId).toBe(SETTLEMENT_ID);
    expect(prisma.settlement.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ completedAt: expect.any(Date) }),
      })
    );
  });

  it('completedAt 이미 있음 → 200 idempotent, update 미호출', async () => {
    vi.mocked(prisma.settlement.findUnique).mockResolvedValue(
      makeSettlement({ completedAt: COMPLETED_AT }) as never
    );

    const res = await call();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.completedAt).toBe(COMPLETED_AT.toISOString());
    expect(prisma.settlement.update).not.toHaveBeenCalled();
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
      makeSettlement({ meetingId: 'other-meeting-id' }) as never
    );

    const res = await call();
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('SETTLEMENT_NOT_FOUND');
  });

  it('status !== CONFIRMED → 409 INVALID_SETTLEMENT_STATUS', async () => {
    vi.mocked(prisma.settlement.findUnique).mockResolvedValue(
      makeSettlement({ status: 'DRAFT' }) as never
    );

    const res = await call();
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error.code).toBe('INVALID_SETTLEMENT_STATUS');
  });

  it('호스트 아님 → 403', async () => {
    vi.mocked(assertHost).mockRejectedValue(
      new ApiError('FORBIDDEN', '호스트만 접근 가능합니다.')
    );

    const res = await call();
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });
});
