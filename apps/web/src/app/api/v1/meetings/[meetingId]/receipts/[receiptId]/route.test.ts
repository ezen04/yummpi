import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { type NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    meeting: { findUnique: vi.fn() },
    receipt: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/current-member', () => ({
  assertHost: vi.fn(),
}));

vi.mock('@/lib/s3', () => ({
  deleteS3Object: vi.fn(),
}));

vi.mock('../_receipt-guards', () => ({
  assertReceiptEditable: vi.fn(),
  assertReceiptDeletable: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { assertHost } from '@/lib/current-member';
import { deleteS3Object } from '@/lib/s3';
import {
  assertReceiptEditable,
  assertReceiptDeletable,
} from '../_receipt-guards';
import { ApiError } from '@/lib/api-response';
import { PATCH, DELETE } from './route';

const MEETING_ID = '11111111-1111-1111-8111-111111111111';
const MEMBER_ID = '22222222-2222-2222-8222-222222222222';
const RECEIPT_ID = '33333333-3333-3333-8333-333333333333';
const OBJECT_KEY = `meetings/${MEETING_ID}/receipts/${RECEIPT_ID}.jpg`;

const params = {
  params: Promise.resolve({ meetingId: MEETING_ID, receiptId: RECEIPT_ID }),
};

function makePatchReq(body: unknown): NextRequest {
  return new Request(
    `http://localhost/api/v1/meetings/${MEETING_ID}/receipts/${RECEIPT_ID}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  ) as unknown as NextRequest;
}

function makeDeleteReq(): NextRequest {
  return new Request(
    `http://localhost/api/v1/meetings/${MEETING_ID}/receipts/${RECEIPT_ID}`,
    { method: 'DELETE' }
  ) as unknown as NextRequest;
}

const VALID_ITEMS = [
  { name: '치킨', quantity: 2, unitPrice: 9000, totalPrice: 18000 },
];

function withTxPatch(mockUpdate: Mock) {
  (prisma.$transaction as unknown as Mock).mockImplementationOnce(
    async (
      fn: (tx: {
        receiptItem: { deleteMany: Mock };
        receipt: { update: Mock };
      }) => unknown
    ) =>
      fn({
        receiptItem: { deleteMany: vi.fn().mockResolvedValue({}) },
        receipt: { update: mockUpdate },
      })
  );
}

function withTxDelete(mockDelete: Mock) {
  (prisma.$transaction as unknown as Mock).mockImplementationOnce(
    async (fn: (tx: { receipt: { delete: Mock } }) => unknown) =>
      fn({ receipt: { delete: mockDelete } })
  );
}

describe('PATCH /api/v1/meetings/:meetingId/receipts/:receiptId', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (prisma.meeting.findUnique as unknown as Mock).mockResolvedValue({
      id: MEETING_ID,
    });
    (assertHost as unknown as Mock).mockResolvedValue({ id: MEMBER_ID });
    (prisma.receipt.findUnique as unknown as Mock).mockResolvedValue({
      id: RECEIPT_ID,
      meetingId: MEETING_ID,
      objectKey: OBJECT_KEY,
    });
    (assertReceiptEditable as unknown as Mock).mockResolvedValue(undefined);
  });

  it('items 교체 성공 — totalAmount 재계산 후 200 반환', async () => {
    const mockUpdate = vi.fn().mockResolvedValue({
      id: RECEIPT_ID,
      objectKey: OBJECT_KEY,
      ocrStatus: 'SUCCEEDED',
      totalAmount: 18000,
      items: [
        {
          id: '44444444-4444-4444-8444-444444444444',
          name: '치킨',
          quantity: 2,
          unitPrice: 9000,
          totalPrice: 18000,
        },
      ],
    });
    withTxPatch(mockUpdate);

    const res = await PATCH(makePatchReq({ items: VALID_ITEMS }), params);

    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { totalAmount: number } };
    expect(body.data.totalAmount).toBe(18000);
    expect(assertReceiptEditable).toHaveBeenCalledWith(
      MEETING_ID,
      expect.anything()
    );
  });

  it('취소된 모임(cancelledAt) → 404 MEETING_NOT_FOUND', async () => {
    (prisma.meeting.findUnique as unknown as Mock).mockResolvedValue(null);

    const res = await PATCH(makePatchReq({ items: VALID_ITEMS }), params);

    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('MEETING_NOT_FOUND');
  });

  it('receipt가 해당 모임 소속이 아님 → 404 RECEIPT_NOT_FOUND', async () => {
    (prisma.receipt.findUnique as unknown as Mock).mockResolvedValue({
      id: RECEIPT_ID,
      meetingId: 'other-meeting-id',
      objectKey: OBJECT_KEY,
    });

    const res = await PATCH(makePatchReq({ items: VALID_ITEMS }), params);

    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('RECEIPT_NOT_FOUND');
  });

  it('tx 내 P2025(receipt 삭제 직전 소멸) → 404 RECEIPT_NOT_FOUND', async () => {
    const p2025 = new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: '5.0.0',
    });
    const mockUpdate = vi.fn().mockRejectedValueOnce(p2025);
    withTxPatch(mockUpdate);

    const res = await PATCH(makePatchReq({ items: VALID_ITEMS }), params);

    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('RECEIPT_NOT_FOUND');
  });

  it('assertReceiptEditable이 FORBIDDEN(CONFIRMED/COMPLETED) throw → 403', async () => {
    (assertReceiptEditable as unknown as Mock).mockRejectedValueOnce(
      new ApiError('FORBIDDEN', '정산이 확정되어 영수증을 수정할 수 없습니다.')
    );
    const mockUpdate = vi.fn();
    withTxPatch(mockUpdate);

    const res = await PATCH(makePatchReq({ items: VALID_ITEMS }), params);

    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/v1/meetings/:meetingId/receipts/:receiptId', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (prisma.meeting.findUnique as unknown as Mock).mockResolvedValue({
      id: MEETING_ID,
    });
    (assertHost as unknown as Mock).mockResolvedValue({ id: MEMBER_ID });
    (prisma.receipt.findUnique as unknown as Mock).mockResolvedValue({
      id: RECEIPT_ID,
      meetingId: MEETING_ID,
      objectKey: OBJECT_KEY,
    });
    (assertReceiptDeletable as unknown as Mock).mockResolvedValue(undefined);
    (deleteS3Object as unknown as Mock).mockResolvedValue(undefined);
  });

  it('DB 삭제 + S3 삭제 성공 → 204 반환', async () => {
    const mockDelete = vi.fn().mockResolvedValue({ id: RECEIPT_ID });
    withTxDelete(mockDelete);

    const res = await DELETE(makeDeleteReq(), params);

    expect(res.status).toBe(204);
    expect(deleteS3Object).toHaveBeenCalledWith(OBJECT_KEY);
  });

  it('S3 삭제 실패 → DB 삭제 성공이면 204 반환 (S3 에러 무시)', async () => {
    const mockDelete = vi.fn().mockResolvedValue({ id: RECEIPT_ID });
    withTxDelete(mockDelete);
    (deleteS3Object as unknown as Mock).mockRejectedValueOnce(
      new Error('S3 network error')
    );

    const res = await DELETE(makeDeleteReq(), params);

    expect(res.status).toBe(204);
  });

  it('tx 내 P2025(receipt 삭제 직전 소멸) → 404 RECEIPT_NOT_FOUND', async () => {
    const p2025 = new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: '5.0.0',
    });
    const mockDelete = vi.fn().mockRejectedValueOnce(p2025);
    withTxDelete(mockDelete);

    const res = await DELETE(makeDeleteReq(), params);

    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('RECEIPT_NOT_FOUND');
  });

  it('취소된 모임(cancelledAt) → 404 MEETING_NOT_FOUND', async () => {
    (prisma.meeting.findUnique as unknown as Mock).mockResolvedValue(null);

    const res = await DELETE(makeDeleteReq(), params);

    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('MEETING_NOT_FOUND');
  });

  it('assertReceiptDeletable가 RECEIPT_LOCKED를 throw → 409', async () => {
    (assertReceiptDeletable as unknown as Mock).mockRejectedValueOnce(
      new ApiError(
        'RECEIPT_LOCKED',
        '정산이 시작되어 영수증을 삭제할 수 없습니다.'
      )
    );
    const mockDelete = vi.fn();
    withTxDelete(mockDelete);

    const res = await DELETE(makeDeleteReq(), params);

    expect(res.status).toBe(409);
  });

  it('assertReceiptDeletable이 FORBIDDEN(CONFIRMED/COMPLETED) throw → 403', async () => {
    (assertReceiptDeletable as unknown as Mock).mockRejectedValueOnce(
      new ApiError('FORBIDDEN', '정산이 확정되어 영수증을 삭제할 수 없습니다.')
    );
    const mockDelete = vi.fn();
    withTxDelete(mockDelete);

    const res = await DELETE(makeDeleteReq(), params);

    expect(res.status).toBe(403);
  });

  it('objectKey 없는 영수증 → S3 삭제 미호출, 204 반환', async () => {
    (prisma.receipt.findUnique as unknown as Mock).mockResolvedValue({
      id: RECEIPT_ID,
      meetingId: MEETING_ID,
      objectKey: null,
    });
    const mockDelete = vi.fn().mockResolvedValue({ id: RECEIPT_ID });
    withTxDelete(mockDelete);

    const res = await DELETE(makeDeleteReq(), params);

    expect(res.status).toBe(204);
    expect(deleteS3Object).not.toHaveBeenCalled();
  });
});
