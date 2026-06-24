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
// - 모임 자체 존재 여부는 별도로 체크하지 않음: MeetingMember는 Meeting에
//   onDelete:Cascade FK이고 Meeting은 소프트 삭제만 하므로(CLAUDE.md), requireMember가
//   멤버를 찾았다면 Meeting은 반드시 존재 — 둘 다 참인 분기는 도달 불가.
// - 매핑 로직(splitMethod 분기·items 그룹핑·isMe·paymentStatus 폴백)은 `_utils`에서
//   단위 테스트.

const paramsSchema = z.object({ meetingId: z.string().uuid() });

export const GET = handleRoute(
  async (
    _req: NextRequest,
    { params }: { params: Promise<{ meetingId: string }> }
  ) => {
    const { meetingId } = paramsSchema.parse(await params);
    const currentMember = await requireMember(meetingId);

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

    const data = buildSettlementResponse(settlement, receipts, currentMember.id);

    // 응답 직전 inner schema parse — Prisma 결과 ↔ 계약 drift 차단.
    const parsed = SettlementResponseSchema.parse(data);
    return apiSuccess(parsed);
  }
);
