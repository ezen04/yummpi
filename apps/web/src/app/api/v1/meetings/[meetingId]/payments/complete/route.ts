import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { handleRoute, apiSuccess, ApiError } from '@/lib/api-response';
import { assertHost } from '@/lib/current-member';
import { prisma } from '@/lib/prisma';
import { transitionMeetingStatus } from '@/lib/meeting-status';

const paramsSchema = z.object({ meetingId: z.string().uuid() });

export const POST = handleRoute(
  async (
    _req: NextRequest,
    { params }: { params: Promise<{ meetingId: string }> }
  ) => {
    const { meetingId } = paramsSchema.parse(await params);

    await assertHost(meetingId);

    // 검증(전원 PAID|EXEMPT) → COMPLETED 전이를 단일 트랜잭션으로 묶는다.
    // 검증 read와 전이 update가 같은 tx에 있어야 그 사이 동시 PATCH로 송금이
    // 되돌려진 채 모임이 종료되는 부분 상태를 막는다(원자적 커밋).
    const updatedMeeting = await prisma.$transaction(async (tx) => {
      const settlement = await tx.settlement.findUnique({
        where: { meetingId },
        include: {
          settlementMembers: {
            include: { payment: true },
          },
        },
      });

      if (!settlement) {
        throw new ApiError(
          'SETTLEMENT_NOT_FOUND',
          '정산 정보를 찾을 수 없습니다.'
        );
      }

      const payments = settlement.settlementMembers
        .map((member) => member.payment)
        .filter((payment) => payment !== null);
      const missingPaymentCount =
        settlement.settlementMembers.length - payments.length;
      const pendingCount = payments.filter(
        (p) => p.status === 'PENDING'
      ).length;
      const reportedCount = payments.filter(
        (p) => p.status === 'TRANSFER_REPORTED'
      ).length;

      if (
        settlement.settlementMembers.length === 0 ||
        payments.length === 0 ||
        missingPaymentCount > 0 ||
        pendingCount > 0 ||
        reportedCount > 0
      ) {
        throw new ApiError(
          'PAYMENTS_NOT_COMPLETED',
          '완료되지 않은 송금이 있습니다.',
          { pendingCount, reportedCount, missingPaymentCount }
        );
      }

      return transitionMeetingStatus(meetingId, 'COMPLETED', {
        tx,
        reason: 'PAYMENTS_COMPLETED',
      });
    });

    return apiSuccess(
      { meetingId, meetingStatus: updatedMeeting.status },
      '전원 송금이 확인되었습니다.'
    );
  }
);
