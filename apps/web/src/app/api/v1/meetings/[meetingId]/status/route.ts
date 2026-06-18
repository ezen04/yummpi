import type { MeetingStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ApiError, apiSuccess, handleRoute } from '@/lib/api-response';
import { assertHost } from '@/lib/current-member';
import {
  MEETING_STATUSES,
  transitionMeetingStatus,
} from '@/lib/meeting-status';
import { bad } from '@/lib/meeting-input';

/**
 * PATCH /api/v1/meetings/:meetingId/status — 상태 변경 (호스트)
 * 순방향 단일 스텝만 허용. 위반 시 409 INVALID_MEETING_STATUS_TRANSITION.
 */

type Ctx = { params: Promise<{ meetingId: string }> };

export const PATCH = handleRoute(async (req: Request, ctx: Ctx) => {
  const { meetingId } = await ctx.params;

  // 존재 확인을 권한 검사보다 먼저: 없는 모임은 403이 아니라 404로 응답.
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: { id: true },
  });
  if (!meeting) {
    throw new ApiError('MEETING_NOT_FOUND', '모임을 찾을 수 없습니다.');
  }
  await assertHost(meetingId);

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const to = body.status;
  if (
    typeof to !== 'string' ||
    !MEETING_STATUSES.includes(to as MeetingStatus)
  ) {
    bad('status 값이 올바르지 않습니다.');
  }
  const target = to as MeetingStatus;

  // 전이 검증 + 갱신(+CANCELLED cancelledAt)은 shared helper에 위임.
  const updated = await transitionMeetingStatus(meetingId, target);

  return apiSuccess(
    { id: updated.id, status: updated.status },
    '모임 상태가 변경되었습니다.'
  );
});
