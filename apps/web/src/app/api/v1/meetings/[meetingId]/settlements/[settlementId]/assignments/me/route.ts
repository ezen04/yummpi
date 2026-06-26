import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { handleRoute, apiSuccess, ApiError } from '@/lib/api-response';
import { requireMember } from '@/lib/current-member';
import {
  SettlementAssignmentRequestSchema,
  SettlementAssignmentResponseSchema,
} from '@yummpi/schemas';
import { runSettlementEngine } from '@/lib/settlement-engine';
import {
  buildItemBasedEngineInput,
  deriveFinalAmounts,
  isSubmissionComplete,
} from './_utils';

// PUT /api/v1/meetings/:meetingId/settlements/:settlementId/assignments/me
// (본인 소비 항목 선택 + ITEM_BASED 자동 계산 트리거, api-spec §10 L362~375)
//
// 순서: 모임 존재(404) → requireMember(403) → ATTENDING 가드(403) → body parse(400) →
//       정산 상태 가드(404/403/400) → 품목 소속 검증(400) → 트랜잭션.
//       (모임 미존재 시 requireMember가 먼저 FORBIDDEN을 던져 404에 도달 못 하므로 — GET
//       settlement·POST settlements와 동일하게 — 존재 확인을 먼저 한다.)
//
// ⚠️ 모임 상태 전이 없음: Settlement는 생성 시점(POST /settlements)에 이미 IN_PROGRESS→SETTLING
//    전이를 끝낸다(분배 방식 무관). 즉 Settlement 행이 존재하면 meeting.status는 항상 SETTLING이므로
//    여기서 다시 전이를 시도하는 코드는 도달 불가능한 분기였다(제거).

const paramsSchema = z.object({
  meetingId: z.string().uuid(),
  settlementId: z.string().uuid(),
});

export const PUT = handleRoute(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ meetingId: string; settlementId: string }> }
  ) => {
    const paramsParsed = paramsSchema.safeParse(await params);
    if (!paramsParsed.success) {
      throw new ApiError(
        'VALIDATION_ERROR',
        '잘못된 경로 파라미터입니다.',
        paramsParsed.error.flatten()
      );
    }
    const { meetingId, settlementId } = paramsParsed.data;

    // 1. 모임 존재 확인 (requireMember보다 먼저 — 그렇지 않으면 미존재 모임이 403으로 가려진다)
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { id: true },
    });
    if (!meeting) {
      throw new ApiError('MEETING_NOT_FOUND', '모임을 찾을 수 없습니다.');
    }

    // 2. 멤버 인증 (모임 소속 검증 포함)
    const currentMember = await requireMember(meetingId);

    // 3. 출석(ATTENDING) 가드 — 분배 엔진의 participantMemberIds는 출석자 집합이다.
    //    비출석자가 항목을 선택하면 ItemAssignment·SettlementMember에 출석 집합 밖의
    //    memberId가 끼어들어 confirm 전 카운트 불변식(api-spec §10 L409~411)이 깨진다.
    if (currentMember.attendanceStatus !== 'ATTENDING') {
      throw new ApiError(
        'FORBIDDEN',
        '참석(ATTENDING) 상태가 아니면 소비 항목을 선택할 수 없습니다.'
      );
    }

    // 4. 바디 파싱 및 검증
    const rawBody = await req.json().catch(() => null);
    const bodyParsed = SettlementAssignmentRequestSchema.safeParse(rawBody);
    if (!bodyParsed.success) {
      throw new ApiError(
        'VALIDATION_ERROR',
        '요청 형식이 올바르지 않습니다.',
        bodyParsed.error.flatten()
      );
    }
    const uniqueReceiptItemIds = Array.from(
      new Set(bodyParsed.data.receiptItemIds)
    );

    // 5. 정산 상태 확인
    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
    });
    if (!settlement || settlement.meetingId !== meetingId) {
      throw new ApiError('SETTLEMENT_NOT_FOUND', '정산을 찾을 수 없습니다.');
    }
    if (
      settlement.status === 'CONFIRMED' ||
      settlement.status === 'COMPLETED'
    ) {
      throw new ApiError('FORBIDDEN', '이미 확정된 정산은 수정할 수 없습니다.');
    }
    if (settlement.splitMethod !== 'ITEM_BASED') {
      throw new ApiError(
        'VALIDATION_ERROR',
        '항목 기반(ITEM_BASED) 정산이 아닙니다.'
      );
    }

    // 6. 선택한 품목이 실제로 이 모임의 영수증에 속하는지 DB로 검증
    const validItemsCount = await prisma.receiptItem.count({
      where: { id: { in: uniqueReceiptItemIds }, receipt: { meetingId } },
    });
    if (validItemsCount !== uniqueReceiptItemIds.length) {
      throw new ApiError(
        'VALIDATION_ERROR',
        '유효하지 않은 영수증 항목이 포함되어 있습니다.'
      );
    }

    // 7. 트랜잭션 (내 할당 갱신 + 전원 제출 시 분배 엔진 가동)
    //    settlement 행에 FOR UPDATE 락을 걸어, 마지막 두 명이 거의 동시에 제출하는 경쟁
    //    조건에서도 "전원 제출 판정 → 엔진 실행 → 결과 반영"이 직렬화되게 한다.
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT id FROM settlements WHERE id = ${settlementId}::uuid FOR UPDATE`;

      // 내 기존 할당 지우고 새 선택으로 교체 (재제출은 전량 재산출 — api-spec §10 L364)
      await tx.itemAssignment.deleteMany({
        where: { settlementId, memberId: currentMember.id },
      });
      if (uniqueReceiptItemIds.length > 0) {
        await tx.itemAssignment.createMany({
          data: uniqueReceiptItemIds.map((itemId) => ({
            settlementId,
            receiptItemId: itemId,
            memberId: currentMember.id,
            shareNumerator: 1,
            shareDenominator: 1, // 분배 전 임시값 — 전원 제출 시 엔진 결과로 갱신
            assignedAmount: 0, // 분배 전 임시값 — 전원 제출 시 엔진 결과로 갱신
          })),
        });
      }

      // 전원 제출 여부 판정 (분모 = 현재 출석 멤버)
      const attendingMembers = await tx.meetingMember.findMany({
        where: { meetingId, attendanceStatus: 'ATTENDING', leftAt: null },
        select: { id: true, role: true },
      });
      const allAssignments = await tx.itemAssignment.findMany({
        where: { settlementId },
        select: { receiptItemId: true, memberId: true },
      });
      const submittedMemberIds = Array.from(
        new Set(allAssignments.map((a) => a.memberId))
      );

      if (
        !isSubmissionComplete(
          submittedMemberIds,
          attendingMembers.map((m) => m.id)
        )
      ) {
        return;
      }

      // 전원 제출 완료 → 분배 엔진 가동
      const receiptItems = await tx.receiptItem.findMany({
        where: { receipt: { meetingId } },
        select: { id: true, totalPrice: true },
      });
      const engineInput = buildItemBasedEngineInput({
        assignments: allAssignments,
        receiptItems,
        attendingMembers,
      });
      const engineOutput = runSettlementEngine(engineInput);
      const derivedMembers = deriveFinalAmounts(
        engineOutput.members,
        settlement.totalAmount,
        engineInput.hostMemberId
      );

      for (const m of derivedMembers) {
        await tx.settlementMember.upsert({
          where: {
            settlementId_memberId: { settlementId, memberId: m.memberId },
          },
          update: {
            itemAmount: m.itemAmount,
            adjustmentAmount: m.adjustmentAmount,
            finalAmount: m.finalAmount,
          },
          create: {
            settlementId,
            memberId: m.memberId,
            itemAmount: m.itemAmount,
            adjustmentAmount: m.adjustmentAmount,
            finalAmount: m.finalAmount,
          },
        });
      }

      for (const oa of engineOutput.itemAssignments ?? []) {
        await tx.itemAssignment.update({
          where: {
            settlementId_receiptItemId_memberId: {
              settlementId,
              receiptItemId: oa.receiptItemId,
              memberId: oa.memberId,
            },
          },
          data: {
            shareNumerator: oa.shareNumerator,
            shareDenominator: oa.shareDenominator,
            assignedAmount: oa.assignedAmount,
          },
        });
      }
    });

    const responseData = SettlementAssignmentResponseSchema.parse({
      memberId: currentMember.id,
      receiptItemIds: uniqueReceiptItemIds,
    });

    return apiSuccess(
      responseData,
      '소비 항목이 성공적으로 저장되었습니다.',
      200
    );
  }
);
