import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { type NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    meeting: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/current-member', () => ({
  assertHost: vi.fn(),
}));

vi.mock('@/lib/s3', () => ({
  getPresignedPutUrl: vi.fn(),
}));

vi.mock('./_receipt-guards', () => ({
  assertReceiptAddable: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { assertHost } from '@/lib/current-member';
import { getPresignedPutUrl } from '@/lib/s3';
import { assertReceiptAddable } from './_receipt-guards';
import { POST } from './route';

const MEETING_ID = '11111111-1111-1111-8111-111111111111';
const MEMBER_ID = '22222222-2222-2222-8222-222222222222';
const RECEIPT_ID = '33333333-3333-3333-8333-333333333333';

const params = { params: Promise.resolve({ meetingId: MEETING_ID }) };

function makeReq(body: unknown): NextRequest {
  return new Request(
    `http://localhost/api/v1/meetings/${MEETING_ID}/receipts`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  ) as unknown as NextRequest;
}

function withTxCreate(mockCreate: Mock) {
  (prisma.$transaction as unknown as Mock).mockImplementationOnce(
    async (fn: (tx: { receipt: { create: Mock } }) => Promise<unknown>) =>
      fn({ receipt: { create: mockCreate } })
  );
}

describe('POST /api/v1/meetings/:meetingId/receipts', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (prisma.meeting.findUnique as unknown as Mock).mockResolvedValue({
      id: MEETING_ID,
    });
    (assertHost as unknown as Mock).mockResolvedValue({ id: MEMBER_ID });
    (getPresignedPutUrl as unknown as Mock).mockResolvedValue(
      'https://s3.example.com/presigned-put?sig=abc'
    );
  });

  it('image/jpeg → objectKey .jpg·ocrStatus PENDING으로 receipt.create 호출, 201 반환', async () => {
    const objectKey = `meetings/${MEETING_ID}/receipts/${RECEIPT_ID}.jpg`;
    const mockCreate = vi
      .fn()
      .mockResolvedValueOnce({ id: RECEIPT_ID, objectKey });
    withTxCreate(mockCreate);

    const res = await POST(
      makeReq({
        receiptId: RECEIPT_ID,
        fileName: 'img.jpg',
        contentType: 'image/jpeg',
        fileSize: 1024,
      }),
      params
    );

    expect(res.status).toBe(201);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          id: RECEIPT_ID,
          objectKey,
          ocrStatus: 'PENDING',
        }),
      })
    );
    expect(assertReceiptAddable).toHaveBeenCalledWith(
      MEETING_ID,
      expect.anything()
    );
  });

  it('image/png → objectKey에 .png 확장자', async () => {
    const objectKey = `meetings/${MEETING_ID}/receipts/${RECEIPT_ID}.png`;
    const mockCreate = vi
      .fn()
      .mockResolvedValueOnce({ id: RECEIPT_ID, objectKey });
    withTxCreate(mockCreate);

    await POST(
      makeReq({
        receiptId: RECEIPT_ID,
        fileName: 'img.png',
        contentType: 'image/png',
        fileSize: 512,
      }),
      params
    );

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ objectKey }),
      })
    );
  });

  it('P2002(receipt ID 중복) → 409 RECEIPT_ALREADY_EXISTS', async () => {
    const p2002 = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed on the fields: (`id`)',
      { code: 'P2002', clientVersion: '5.0.0' }
    );
    const mockCreate = vi.fn().mockRejectedValueOnce(p2002);
    withTxCreate(mockCreate);

    const res = await POST(
      makeReq({
        receiptId: RECEIPT_ID,
        fileName: 'img.jpg',
        contentType: 'image/jpeg',
        fileSize: 1024,
      }),
      params
    );

    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('RECEIPT_ALREADY_EXISTS');
  });
});
