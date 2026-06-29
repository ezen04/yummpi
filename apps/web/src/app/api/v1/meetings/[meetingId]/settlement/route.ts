import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { SettlementResponseSchema } from '@yummpi/schemas';
import { handleRoute, apiSuccess, ApiError } from '@/lib/api-response';
import { requireMember } from '@/lib/current-member';
import { prisma } from '@/lib/prisma';
import { buildSettlementResponse, isSettlementCalculated } from './_utils';

// GET /api/v1/meetings/:meetingId/settlement (단수, api-spec v2.2 §10)
// - 회원·게스트 모두 모임 멤버면 조회 가능. 비멤버 403(requireMember).
// - 정산 미생성 404. 정산은 POST /settlements 후에만 존재.
// - requireMember 전에 모임 존재를 먼저 확인. 순서를 뒤집으면 모임 미존재 시
//   requireMember가 멤버를 못 찾아 FORBIDDEN(403)으로 빠져 MEETING_NOT_FOUND(404)에
//   도달 불가 → 응답이 의미와 어긋난다.
// - 매핑 로직(splitMethod 분기·items 그룹핑·isMe·paymentStatus 폴백)은 `_utils`에서
//   단위 테스트.

const paramsSchema = z.object({ meetingId: z.string().uuid() });

export const GET = handleRoute(
  async (
    _req: NextRequest,
    { params }: { params: Promise<{ meetingId: string }> }
  ) => {
    // handleRoute는 ApiError만 envelope으로 변환 → Zod parse() 직접 호출은 500이 된다.
    // params는 safeParse + 명시 VALIDATION_ERROR(400) throw로 정합 유지.
    const paramsParsed = paramsSchema.safeParse(await params);
    if (!paramsParsed.success) {
      throw new ApiError(
        'VALIDATION_ERROR',
        '잘못된 모임 식별자 형식입니다.',
        paramsParsed.error.flatten()
      );
    }
    const { meetingId } = paramsParsed.data;

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { id: true },
    });
    if (!meeting) {
      throw new ApiError('MEETING_NOT_FOUND', '모임을 찾을 수 없습니다.');
    }

    const currentMember = await requireMember(meetingId);

    if (currentMember.attendanceStatus === 'ABSENT') {
      throw new ApiError(
        'FORBIDDEN',
        '불참 처리된 멤버는 정산 화면에 접근할 수 없습니다.'
      );
    }

    const settlement = await prisma.settlement.findUnique({
      where: { meetingId },
      include: {
        settlementMembers: {
          include: { member: true, payment: true },
        },
        itemAssignments: {
          include: { receiptItem: true },
        },
      },
    });
    if (!settlement) {
      throw new ApiError(
        'SETTLEMENT_NOT_FOUND',
        '정산 정보를 찾을 수 없습니다.'
      );
    }

    if (!isSettlementCalculated(settlement)) {
      throw new ApiError(
        'SETTLEMENT_CALCULATION_PENDING',
        '정산 계산이 완료되지 않았습니다.'
      );
    }

    // receipts[]: Receipt.totalAmount는 nullable(OCR 실패 fallback). schema는
    // positive() 강제이므로 null/0은 응답에서 제외.
    const receiptRows = await prisma.receipt.findMany({
      where: { meetingId, totalAmount: { not: null, gt: 0 } },
      select: { id: true, totalAmount: true },
      orderBy: { createdAt: 'asc' },
    });
    const receipts = receiptRows.map((r) => ({
      id: r.id,
      totalAmount: r.totalAmount as number,
    }));

    const raw = buildSettlementResponse(settlement, receipts, currentMember.id);

    // host는 전원 items 포함 조회, 일반 멤버는 전원 금액 보이되 items는 본인 행만.
    const data =
      currentMember.role === 'HOST'
        ? raw
        : {
            ...raw,
            settlementMembers: raw.settlementMembers.map((m) =>
              m.isMe ? m : { ...m, items: null }
            ),
          };

    // 응답 직전 inner schema parse — Prisma 결과 ↔ 계약 drift 차단.
    const parsed = SettlementResponseSchema.parse(data);
    return apiSuccess(parsed);
  }
);
