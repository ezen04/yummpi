import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { handleRoute, apiSuccess, ApiError } from '@/lib/api-response';
import { assertHost } from '@/lib/current-member';
import { prisma } from '@/lib/prisma';
import { buildPaymentListResponse } from '../_utils';

const paramsSchema = z.object({ meetingId: z.string().uuid() });

export const POST = handleRoute(
  async (
    _req: NextRequest,
    { params }: { params: Promise<{ meetingId: string }> }
  ) => {
    const { meetingId } = paramsSchema.parse(await params);

    const currentMember = await assertHost(meetingId);

    const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
    if (!meeting) throw new ApiError('MEETING_NOT_FOUND', '모임을 찾을 수 없습니다.');

    const settlement = await prisma.settlement.findUnique({
      where: { meetingId },
      include: {
        settlementMembers: { include: { member: true, payment: true } },
      },
    });
    if (!settlement) {
      throw new ApiError('SETTLEMENT_NOT_FOUND', '정산 정보를 찾을 수 없습니다.');
    }
    if (settlement.status !== 'CONFIRMED') {
      throw new ApiError(
        'INVALID_SETTLEMENT_STATUS',
        '정산이 확정된 후에만 송금을 초기화할 수 있습니다.'
      );
    }

    // idempotent: Payment가 없는 SettlementMember에만 생성
    const missing = settlement.settlementMembers.filter((sm) => sm.payment === null);
    if (missing.length > 0) {
      await prisma.payment.createMany({
        data: missing.map((sm) => ({
          settlementMemberId: sm.id,
          amount: sm.finalAmount,
          status: 'PENDING' as const,
        })),
        skipDuplicates: true,
      });
    }

    // 최신 Payment 포함하여 재조회
    const updated = await prisma.settlement.findUniqueOrThrow({
      where: { meetingId },
      include: {
        settlementMembers: { include: { member: true, payment: true } },
      },
    });

    return apiSuccess(
      buildPaymentListResponse(meetingId, updated, currentMember),
      '송금이 초기화되었습니다.',
      201
    );
  }
);
