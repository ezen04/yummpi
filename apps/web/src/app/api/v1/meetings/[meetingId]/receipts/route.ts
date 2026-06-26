import { type NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import {
  OcrReceiptRequestSchema,
  OcrReceiptResponseSchema,
} from '@yummpi/schemas';
import { handleRoute, apiSuccess, ApiError } from '@/lib/api-response';
import { assertHost } from '@/lib/current-member';
import { prisma } from '@/lib/prisma';
import { callGeneralOcr, OcrFailedError } from '@/lib/ocr';
import { parseReceipt } from '@/lib/ocr/parser';
import { assertReceiptAddable } from './_receipt-guards';
import {
  buildReceiptCreateInput,
  type ReceiptItemInput,
} from './_receipt-input';
import {
  maskTokensForStorage,
  sumItemTotals,
  toReceiptItemInputs,
} from './_ocr-utils';

const paramsSchema = z.object({ meetingId: z.string().uuid() });

// `POST /api/v1/meetings/:meetingId/receipts` — OCR 분석 + 영수증 생성 (BE-2b)
// api-spec §9. S3/presigned 단계는 16:00 이후로 이월(WORK.md 결정) → 지금은
// base64 직접 전송 + receipt 생성/OCR 분석을 한 라우트에서 처리한다.
//
// 영수증 1장 단위 독립 호출 — FE(useOcrProcessor)가 영수증마다 이 라우트를
// 따로 호출해 Promise.allSettled로 묶으므로, "1장 실패해도 나머지 진행"은
// 여기서 신경 쓸 필요 없다(이 함수는 자기 1장만 책임진다).
export const POST = handleRoute(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ meetingId: string }> }
  ) => {
    const paramsParsed = paramsSchema.safeParse(await params);
    if (!paramsParsed.success) {
      throw new ApiError(
        'VALIDATION_ERROR',
        '잘못된 모임 식별자 형식입니다.',
        paramsParsed.error.flatten()
      );
    }
    const { meetingId } = paramsParsed.data;

    // assertHost 전에 모임 존재를 먼저 확인 — manual 라우트와 동일 순서
    // (모임 미존재 시 requireMember가 멤버 못 찾아 FORBIDDEN(403)으로 빠지면
    // MEETING_NOT_FOUND(404)에 도달 불가).
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { id: true },
    });
    if (!meeting) {
      throw new ApiError('MEETING_NOT_FOUND', '모임을 찾을 수 없습니다.');
    }

    const currentMember = await assertHost(meetingId);

    const rawBody = await req.json().catch(() => null);
    const parsed = OcrReceiptRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new ApiError(
        'VALIDATION_ERROR',
        '요청 형식이 올바르지 않습니다.',
        parsed.error.flatten()
      );
    }
    const { receiptId, imageBase64, format } = parsed.data;

    await assertReceiptAddable(meetingId);

    let ocrStatus: 'SUCCEEDED' | 'FAILED' = 'SUCCEEDED';
    let items: ReceiptItemInput[] = [];
    let unclassifiedLines: string[] = [];
    let rawOcrJson: Awaited<ReturnType<typeof maskTokensForStorage>> | null =
      null;
    let failureMessage: string | null = null;

    try {
      const tokens = await callGeneralOcr(imageBase64, format);
      rawOcrJson = maskTokensForStorage(tokens);
      const parsedReceipt = parseReceipt(tokens);
      unclassifiedLines = parsedReceipt.unclassifiedLines;

      if (parsedReceipt.items.length === 0) {
        // 토큰은 받았으나 품목을 하나도 못 골라낸 경우 — "성공"으로 두면 0원
        // 영수증이 그대로 정산에 들어가 사용자가 알아채기 어렵다. 수동 입력
        // fallback을 타도록 FAILED로 강제한다.
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

    // 더블체크: OCR 전 빠른 기각(fast-fail) + 트랜잭션 안 원자적 재검사로
    // 병렬 업로드 TOCTOU 창을 좁힌다. READ COMMITTED 기본값이라 극히 짧은
    // 경합 창은 남음 — Serializable로 완전 차단은 추후 작업(deferred).
    const created = await prisma.$transaction(async (tx) => {
      await assertReceiptAddable(meetingId, tx);
      return tx.receipt
        .create({
          data: buildReceiptCreateInput({
            id: receiptId,
            meetingId,
            uploadedByMemberId: currentMember.id,
            ocrStatus,
            objectKey: null,
            imageUrl: null,
            rawOcrJson,
            totalAmount: sumItemTotals(items),
            items,
          }),
          include: { items: { orderBy: { sortOrder: 'asc' } } },
        })
        .catch((err: unknown) => {
          if (
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === 'P2002'
          ) {
            throw new ApiError(
              'RECEIPT_ALREADY_EXISTS',
              '이미 등록된 영수증 ID입니다.'
            );
          }
          throw err;
        });
    });

    if (ocrStatus === 'FAILED') {
      // 영수증은 FAILED로 영속해뒀으니, 응답은 실패 봉투로 — FE
      // useOcrProcessor의 allSettled가 그대로 rejected 분기(FAILED 카드)로
      // 받는다(api-spec §9 "실패 영수증만 ocrStatus: FAILED + 수동 입력 fallback").
      throw new ApiError(
        'OCR_REQUEST_FAILED',
        failureMessage ?? 'OCR 처리에 실패했습니다.',
        { receiptId: created.id }
      );
    }

    const response = OcrReceiptResponseSchema.parse({
      receiptId: created.id,
      objectKey: null,
      ocrStatus: created.ocrStatus,
      totalAmount: created.totalAmount,
      items: created.items.map((item) => ({
        receiptItemId: item.id,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
      unclassifiedLines,
    });
    return apiSuccess(response, undefined, 201);
  }
);
