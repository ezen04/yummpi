import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { OcrReceiptResponseSchema } from '@yummpi/schemas';
import { handleRoute, apiSuccess, ApiError } from '@/lib/api-response';
import { assertHost } from '@/lib/current-member';
import { prisma } from '@/lib/prisma';
import { getPresignedGetUrl } from '@/lib/s3';
import { callGeneralOcr, OcrFailedError } from '@/lib/ocr';
import { parseReceipt } from '@/lib/ocr/parser';
import {
  maskTokensForStorage,
  sumItemTotals,
  toReceiptItemInputs,
} from '../../_ocr-utils';

const paramsSchema = z.object({
  meetingId: z.string().uuid(),
  receiptId: z.string().uuid(),
});

// `POST /api/v1/meetings/:meetingId/receipts/:receiptId/ocr` — OCR 분석 ★ v2.1
// api-spec §9. presigned GET URL을 CLOVA에 넘겨 S3 오브젝트를 직접 fetch하게 한다.
// 요청 바디 없음 — receiptId(URL)로 Receipt 조회, objectKey에서 format 파생.
export const POST = handleRoute(
  async (
    _req: NextRequest,
    { params }: { params: Promise<{ meetingId: string; receiptId: string }> }
  ) => {
    const paramsParsed = paramsSchema.safeParse(await params);
    if (!paramsParsed.success) {
      throw new ApiError(
        'VALIDATION_ERROR',
        '잘못된 식별자 형식입니다.',
        paramsParsed.error.flatten()
      );
    }
    const { meetingId, receiptId } = paramsParsed.data;

    // meeting 존재 확인 먼저 — assertHost가 member 못 찾아 403 대신 404를 반환
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { id: true },
    });
    if (!meeting) {
      throw new ApiError('MEETING_NOT_FOUND', '모임을 찾을 수 없습니다.');
    }

    await assertHost(meetingId);

    const receipt = await prisma.receipt.findUnique({
      where: { id: receiptId },
      select: { id: true, meetingId: true, objectKey: true, ocrStatus: true },
    });

    if (!receipt || receipt.meetingId !== meetingId) {
      throw new ApiError('RECEIPT_NOT_FOUND', '영수증을 찾을 수 없습니다.');
    }
    if (!receipt.objectKey) {
      throw new ApiError('VALIDATION_ERROR', '이미지가 없는 영수증입니다.');
    }
    if (receipt.ocrStatus === 'SUCCEEDED') {
      throw new ApiError(
        'RECEIPT_ALREADY_OCR_SUCCEEDED',
        '이미 OCR 처리된 영수증입니다.'
      );
    }
    // FAILED는 재시도 허용 — items 없으므로 update 충돌 없음

    const format: 'jpg' | 'png' =
      receipt.objectKey.split('.').pop()?.toLowerCase() === 'png'
        ? 'png'
        : 'jpg';

    const imageUrl = await getPresignedGetUrl(receipt.objectKey);

    let ocrStatus: 'SUCCEEDED' | 'FAILED' = 'SUCCEEDED';
    let items: ReturnType<typeof toReceiptItemInputs> = [];
    let unclassifiedLines: string[] = [];
    let rawOcrJson: ReturnType<typeof maskTokensForStorage> | null = null;
    let failureMessage: string | null = null;

    try {
      const tokens = await callGeneralOcr(imageUrl, format);
      rawOcrJson = maskTokensForStorage(tokens);
      const parsedReceipt = parseReceipt(tokens);
      unclassifiedLines = parsedReceipt.unclassifiedLines;

      if (parsedReceipt.items.length === 0) {
        ocrStatus = 'FAILED';
        failureMessage = 'OCR이 영수증에서 품목을 찾지 못했습니다.';
      } else {
        items = toReceiptItemInputs(parsedReceipt.items);
      }
    } catch (err) {
      ocrStatus = 'FAILED';
      failureMessage =
        err instanceof OcrFailedError
          ? err.message
          : 'OCR 처리 중 오류가 발생했습니다.';
    }

    const updated = await prisma.receipt.update({
      where: { id: receiptId },
      data: {
        ocrStatus,
        totalAmount: ocrStatus === 'SUCCEEDED' ? sumItemTotals(items) : null,
        ...(rawOcrJson !== null ? { rawOcrJson } : {}),
        ...(ocrStatus === 'SUCCEEDED'
          ? {
              items: {
                create: items.map((item, idx) => ({
                  name: item.name,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  totalPrice: item.totalPrice,
                  ocrConfidence: item.ocrConfidence ?? null,
                  sortOrder: idx,
                })),
              },
            }
          : {}),
      },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });

    if (ocrStatus === 'FAILED') {
      throw new ApiError(
        'OCR_REQUEST_FAILED',
        failureMessage ?? 'OCR 처리에 실패했습니다.',
        { receiptId: updated.id }
      );
    }

    const response = OcrReceiptResponseSchema.parse({
      receiptId: updated.id,
      objectKey: updated.objectKey,
      ocrStatus: updated.ocrStatus,
      totalAmount: updated.totalAmount,
      items: updated.items.map((item) => ({
        receiptItemId: item.id,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
      unclassifiedLines,
    });
    return apiSuccess(response, undefined, 200);
  }
);
