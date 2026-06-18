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

    const payments = await prisma.payment.findMany({
      where: { settlementMember: { settlement: { meetingId } } },
    });

    const pendingCount = payments.filter((p) => p.status === 'PENDING').length;
    const reportedCount = payments.filter(
      (p) => p.status === 'TRANSFER_REPORTED'
    ).length;

    if (pendingCount > 0 || reportedCount > 0) {
      throw new ApiError(
        'PAYMENTS_NOT_COMPLETED',
        '완료되지 않은 송금이 있습니다.',
        { pendingCount, reportedCount }
      );
    }

    const updatedMeeting = await transitionMeetingStatus(meetingId, 'COMPLETED', {
      reason: 'PAYMENTS_COMPLETED',
    });

    return apiSuccess(
      { meetingId, meetingStatus: updatedMeeting.status },
      '전원 송금이 확인되었습니다.'
    );
  }
);
