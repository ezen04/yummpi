import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { handleRoute, apiSuccess, ApiError } from '@/lib/api-response';
import { assertHost } from '@/lib/current-member';
import { prisma } from '@/lib/prisma';

const paramsSchema = z.object({ meetingId: z.string().uuid() });

export const POST = handleRoute(
  async (
    _req: NextRequest,
    { params }: { params: Promise<{ meetingId: string }> }
  ) => {
    const { meetingId } = paramsSchema.parse(await params);

    await assertHost(meetingId);

    const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
    if (!meeting) throw new ApiError('MEETING_NOT_FOUND', '모임을 찾을 수 없습니다.');

    const payments = await prisma.payment.findMany({
      where: { settlementMember: { settlement: { meetingId } } },
    });

    const pendingCount = payments.filter((p) => p.status === 'PENDING').length;
    const reportedCount = payments.filter((p) => p.status === 'TRANSFER_REPORTED').length;

    if (pendingCount > 0 || reportedCount > 0) {
      throw new ApiError(
        'PAYMENTS_NOT_COMPLETED',
        '완료되지 않은 송금이 있습니다.',
        { pendingCount, reportedCount }
      );
    }

    // TODO: ① transitionMeetingStatus helper 머지 후 아래 주석 해제
    // await transitionMeetingStatus(meetingId, 'COMPLETED');
    // 현재는 검증만 수행하고 상태 전환은 보류한다.

    return apiSuccess(
      { meetingId, meetingStatus: meeting.status },
      '전원 송금이 확인되었습니다.'
    );
  }
);
