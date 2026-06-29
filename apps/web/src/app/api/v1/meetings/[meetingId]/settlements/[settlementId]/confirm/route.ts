import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { handleRoute, apiSuccess, ApiError } from '@/lib/api-response';
import { assertHost } from '@/lib/current-member';
import { prisma } from '@/lib/prisma';

// POST /api/v1/meetings/:meetingId/settlements/:settlementId/confirm
// (정산 확정, api-spec §10 L402~418)
//
// 호스트 전용. 사전 조건:
//   - ATTENDING 멤버 >= 1명
//   - ATTENDING 멤버 수 == SettlementMember 레코드 수 (전원 제출 완료)
// 이미 CONFIRMED면 200 idempotent (버튼 중복 클릭·재요청 대응).
//
// ④ 보장 범위: Settlement.status = CONFIRMED + confirmedAt 기록.
// Payment 생성은 ⑤의 POST /payments/initialize 담당.

const paramsSchema = z.object({
  meetingId: z.string().uuid(),
  settlementId: z.string().uuid(),
});

export const POST = handleRoute(
  async (
    _req: NextRequest,
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

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { id: true, status: true },
    });
    if (!meeting) {
      throw new ApiError('MEETING_NOT_FOUND', '모임을 찾을 수 없습니다.');
    }
    if (meeting.status !== 'SETTLING') {
      throw new ApiError(
        'INVALID_MEETING_STATUS_TRANSITION',
        '정산 확정은 SETTLING 상태에서만 가능합니다.'
      );
    }

    await assertHost(meetingId);

    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
      select: { id: true, meetingId: true, status: true, confirmedAt: true },
    });
    if (!settlement || settlement.meetingId !== meetingId) {
      throw new ApiError('SETTLEMENT_NOT_FOUND', '정산을 찾을 수 없습니다.');
    }

    // 이미 CONFIRMED/COMPLETED → 200 idempotent
    if (
      settlement.status === 'CONFIRMED' ||
      settlement.status === 'COMPLETED'
    ) {
      return apiSuccess({
        settlementId: settlement.id,
        status: settlement.status,
        confirmedAt: settlement.confirmedAt?.toISOString() ?? null,
      });
    }

    const confirmed = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT id FROM settlements WHERE id = ${settlementId}::uuid FOR UPDATE`;

      // 락 획득 후 status 재확인 — 외부 idempotent 체크와 트랜잭션 사이에 동시 요청이
      // 먼저 CONFIRMED로 커밋됐을 경우 confirmedAt 덮어쓰기를 막는다(TOCTOU).
      const lockedSettlement = await tx.settlement.findUnique({
        where: { id: settlementId },
        select: { id: true, status: true, confirmedAt: true },
      });
      if (
        lockedSettlement?.status === 'CONFIRMED' ||
        lockedSettlement?.status === 'COMPLETED'
      ) {
        return lockedSettlement;
      }

      const attendingCount = await tx.meetingMember.count({
        where: { meetingId, attendanceStatus: 'ATTENDING', leftAt: null },
      });
      if (attendingCount < 1) {
        throw new ApiError(
          'VALIDATION_ERROR',
          '참석 멤버가 없어 정산을 확정할 수 없습니다.'
        );
      }

      const settlementMemberCount = await tx.settlementMember.count({
        where: { settlementId },
      });
      if (attendingCount !== settlementMemberCount) {
        throw new ApiError(
          'SETTLEMENT_CALCULATION_PENDING',
          '아직 모든 참여자가 소비 항목을 선택하지 않았습니다.'
        );
      }

      return tx.settlement.update({
        where: { id: settlementId },
        data: { status: 'CONFIRMED', confirmedAt: new Date() },
        select: { id: true, status: true, confirmedAt: true },
      });
    });

    return apiSuccess({
      settlementId: confirmed.id,
      status: confirmed.status,
      confirmedAt: confirmed.confirmedAt?.toISOString() ?? null,
    });
  }
);
