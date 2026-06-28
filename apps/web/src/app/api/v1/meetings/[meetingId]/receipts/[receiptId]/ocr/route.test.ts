import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { type NextRequest } from 'next/server';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    meeting: { findUnique: vi.fn() },
    receipt: { findUnique: vi.fn(), update: vi.fn() },
  },
}));

vi.mock('@/lib/current-member', () => ({
  assertHost: vi.fn(),
}));

vi.mock('@/lib/s3', () => ({
  getPresignedGetUrl: vi.fn(),
}));

vi.mock('@/lib/ocr', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/ocr')>();
  return { ...actual, callGeneralOcr: vi.fn() };
});

vi.mock('@/lib/ocr/parser', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/ocr/parser')>();
  return { ...actual, parseReceipt: vi.fn() };
});

import { prisma } from '@/lib/prisma';
import { assertHost } from '@/lib/current-member';
import { getPresignedGetUrl } from '@/lib/s3';
import { callGeneralOcr, OcrFailedError } from '@/lib/ocr';
import { parseReceipt } from '@/lib/ocr/parser';
import { POST } from './route';

const MEETING_ID = '11111111-1111-1111-8111-111111111111';
const MEMBER_ID = '22222222-2222-2222-8222-222222222222';
const RECEIPT_ID = '33333333-3333-3333-8333-333333333333';
const OBJECT_KEY = `meetings/${MEETING_ID}/receipts/${RECEIPT_ID}.jpg`;
const PRESIGNED_GET_URL = 'https://s3.example.com/presigned-get?sig=xyz';

const TOKEN = {
  text: '치킨',
  confidence: 0.99,
  cx: 0,
  cy: 0,
  width: 10,
  height: 10,
};
const PARSED_ITEM = {
  name: '치킨',
  quantity: 1,
  unitPrice: 18000,
  totalPrice: 18000,
  confidence: 0.99,
};

const params = {
  params: Promise.resolve({ meetingId: MEETING_ID, receiptId: RECEIPT_ID }),
};

function makeReq(): NextRequest {
  return new Request(
    `http://localhost/api/v1/meetings/${MEETING_ID}/receipts/${RECEIPT_ID}/ocr`,
    { method: 'POST' }
  ) as unknown as NextRequest;
}

describe('POST /api/v1/meetings/:meetingId/receipts/:receiptId/ocr', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (prisma.meeting.findUnique as unknown as Mock).mockResolvedValue({
      id: MEETING_ID,
    });
    (assertHost as unknown as Mock).mockResolvedValue({ id: MEMBER_ID });
  });

  it('ocrStatus가 SUCCEEDED인 영수증 → 409 RECEIPT_ALREADY_OCR_SUCCEEDED', async () => {
    (prisma.receipt.findUnique as unknown as Mock).mockResolvedValue({
      id: RECEIPT_ID,
      meetingId: MEETING_ID,
      objectKey: OBJECT_KEY,
      ocrStatus: 'SUCCEEDED',
    });

    const res = await POST(makeReq(), params);

    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('RECEIPT_ALREADY_OCR_SUCCEEDED');
  });

  it('ocrStatus가 FAILED인 영수증 → 재시도 허용, getPresignedGetUrl URL을 callGeneralOcr에 전달', async () => {
    (prisma.receipt.findUnique as unknown as Mock).mockResolvedValue({
      id: RECEIPT_ID,
      meetingId: MEETING_ID,
      objectKey: OBJECT_KEY,
      ocrStatus: 'FAILED',
    });
    (getPresignedGetUrl as unknown as Mock).mockResolvedValue(
      PRESIGNED_GET_URL
    );
    (callGeneralOcr as unknown as Mock).mockResolvedValue([TOKEN]);
    (parseReceipt as unknown as Mock).mockReturnValue({
      items: [PARSED_ITEM],
      unclassifiedLines: [],
    });
    (prisma.receipt.update as unknown as Mock).mockResolvedValue({
      id: RECEIPT_ID,
      objectKey: OBJECT_KEY,
      ocrStatus: 'SUCCEEDED',
      totalAmount: 18000,
      items: [
        {
          id: '44444444-4444-4444-8444-444444444444',
          name: '치킨',
          quantity: 1,
          unitPrice: 18000,
          totalPrice: 18000,
          sortOrder: 0,
        },
      ],
    });

    const res = await POST(makeReq(), params);

    expect(callGeneralOcr).toHaveBeenCalledWith(PRESIGNED_GET_URL, 'jpg');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { ocrStatus: string } };
    expect(body.data.ocrStatus).toBe('SUCCEEDED');
  });

  it('callGeneralOcr 실패 → receipt.update(FAILED) 후 502 OCR_REQUEST_FAILED (fallback 불변식)', async () => {
    (prisma.receipt.findUnique as unknown as Mock).mockResolvedValue({
      id: RECEIPT_ID,
      meetingId: MEETING_ID,
      objectKey: OBJECT_KEY,
      ocrStatus: 'PENDING',
    });
    (getPresignedGetUrl as unknown as Mock).mockResolvedValue(
      PRESIGNED_GET_URL
    );
    (callGeneralOcr as unknown as Mock).mockRejectedValue(
      new OcrFailedError('INFER_FAILURE', '이미지가 흐려 인식 불가')
    );
    (prisma.receipt.update as unknown as Mock).mockResolvedValue({
      id: RECEIPT_ID,
      objectKey: OBJECT_KEY,
      ocrStatus: 'FAILED',
      totalAmount: null,
      items: [],
    });

    const res = await POST(makeReq(), params);

    expect(res.status).toBe(502);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('OCR_REQUEST_FAILED');
    expect(prisma.receipt.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ ocrStatus: 'FAILED' }),
      })
    );
  });
});
