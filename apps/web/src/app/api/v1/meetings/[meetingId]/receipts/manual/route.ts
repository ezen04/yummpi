import { type NextRequest } from 'next/server';
import { z } from 'zod';
import {
  ManualReceiptRequestSchema,
  ManualReceiptResponseSchema,
} from '@yummpi/schemas';
import { handleRoute, apiSuccess, ApiError } from '@/lib/api-response';
import { assertHost } from '@/lib/current-member';
import { prisma } from '@/lib/prisma';
import { buildManualReceiptInput, buildManualReceiptResponse } from './_utils';

const paramsSchema = z.object({ meetingId: z.string().uuid() });
const RECEIPT_LIMIT = 4;

// `POST /api/v1/meetings/:meetingId/receipts/manual` — 이미지·OCR 없이 영수증 직접 입력
// api-spec §9 L297-329 · 호스트 전용(L257). LOCK(settlement 행 존재)·LIMIT(4장) 가드 후
// receipt + nested items 단일 트랜잭션 생성. handleRoute가 ApiError만 envelope으로
// 변환하므로 Zod 실패는 safeParse로 받아 VALIDATION_ERROR(400)를 명시 throw 한다.
export const POST = handleRoute(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ meetingId: string }> }
  ) => {
    // handleRoute는 ApiError만 envelope으로 변환 → Zod parse() 직접 호출은 500이 된다.
    // params·body 모두 safeParse + 명시 VALIDATION_ERROR(400) throw로 정합 유지.
    const paramsParsed = paramsSchema.safeParse(await params);
    if (!paramsParsed.success) {
      throw new ApiError(
        'VALIDATION_ERROR',
        '잘못된 모임 식별자 형식입니다.',
        paramsParsed.error.flatten()
      );
    }
    const { meetingId } = paramsParsed.data;

    // assertHost 전에 모임 존재를 먼저 확인. 순서를 뒤집으면 모임 미존재 시
    // requireMember가 멤버 못 찾아 FORBIDDEN(403)으로 빠져 MEETING_NOT_FOUND(404)에
    // 도달 불가 → 응답이 의미와 어긋난다.
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { id: true },
    });
    if (!meeting) {
      throw new ApiError('MEETING_NOT_FOUND', '모임을 찾을 수 없습니다.');
    }

    const currentMember = await assertHost(meetingId);

    const rawBody = await req.json().catch(() => null);
    const parsed = ManualReceiptRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new ApiError(
        'VALIDATION_ERROR',
        '요청 형식이 올바르지 않습니다.',
        parsed.error.flatten()
      );
    }

    // LOCK: settlements 행 존재 시 영수증 추가 금지 (api-spec §9 L259).
    const settlement = await prisma.settlement.findUnique({
      where: { meetingId },
      select: { id: true },
    });
    if (settlement) {
      throw new ApiError(
        'RECEIPT_LOCKED',
        '정산이 시작되어 영수증을 추가할 수 없습니다.'
      );
    }

    // LIMIT: 모임당 4장 (api-spec §9 L270·L328). 5장째는 422.
    const receiptCount = await prisma.receipt.count({ where: { meetingId } });
    if (receiptCount >= RECEIPT_LIMIT) {
      throw new ApiError(
        'RECEIPT_LIMIT_EXCEEDED',
        `영수증은 모임당 최대 ${RECEIPT_LIMIT}장까지 등록할 수 있습니다.`
      );
    }

    const created = await prisma.receipt.create({
      data: buildManualReceiptInput(meetingId, currentMember.id, parsed.data),
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });

    const response = ManualReceiptResponseSchema.parse(
      buildManualReceiptResponse(created)
    );
    return apiSuccess(response, undefined, 201);
  }
);
