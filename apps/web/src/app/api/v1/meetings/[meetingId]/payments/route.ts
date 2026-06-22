import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { handleRoute, apiSuccess, ApiError } from '@/lib/api-response';
import { requireMember } from '@/lib/current-member';
import { prisma } from '@/lib/prisma';
import { buildPaymentListResponse } from './_utils';
import { fetchCooldownMap } from '@/lib/remind-redis';

const paramsSchema = z.object({ meetingId: z.string().uuid() });

export const GET = handleRoute(
  async (
    _req: NextRequest,
    { params }: { params: Promise<{ meetingId: string }> }
  ) => {
    const { meetingId } = paramsSchema.parse(await params);

    const currentMember = await requireMember(meetingId);

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
    });
    if (!meeting)
      throw new ApiError('MEETING_NOT_FOUND', '모임을 찾을 수 없습니다.');

    const settlement = await prisma.settlement.findUnique({
      where: { meetingId },
      include: {
        settlementMembers: { include: { member: true, payment: true } },
      },
    });
    if (!settlement) {
      throw new ApiError(
        'SETTLEMENT_NOT_FOUND',
        '정산 정보를 찾을 수 없습니다.'
      );
    }

    const paymentIds = settlement.settlementMembers
      .map((sm) => sm.payment?.id)
      .filter((id): id is string => id !== undefined);
    const cooldownMap = await fetchCooldownMap(paymentIds);

    // 순수 조회 — Payment가 없어도 생성하지 않는다.
    return apiSuccess(
      buildPaymentListResponse(
        meetingId,
        settlement,
        currentMember,
        cooldownMap
      )
    );
  }
);
