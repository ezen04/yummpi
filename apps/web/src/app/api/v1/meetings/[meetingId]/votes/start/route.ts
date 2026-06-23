import { prisma } from '@/lib/prisma';
import { ApiError, apiSuccess, handleRoute } from '@/lib/api-response';
import { assertHost } from '@/lib/current-member';
import { transitionMeetingStatus } from '@/lib/meeting-status';
import { socketEmitter } from '@/lib/socket-emitter';

type Ctx = { params: Promise<{ meetingId: string }> };

interface PostBody {
  votingClosesAt: string;
}

/**
 * POST /api/v1/meetings/:meetingId/votes/start — 투표 시작 (호스트 전용)
 *
 * - 상태 전이: RECRUITING → VOTING (단계 머신 경유)
 * - votingClosesAt 설정 (현재 < x ≤ meeting.scheduledAt)
 * - ACTIVE 후보 ≥ 1개 필수
 * - 성공 시 `meeting:status-changed` broadcast
 */
export const POST = handleRoute(async (req: Request, { params }: Ctx) => {
  const { meetingId } = await params;
  await assertHost(meetingId);

  const body = (await req.json().catch(() => ({}))) as Partial<PostBody>;
  const votingClosesAtRaw = body.votingClosesAt;

  if (!votingClosesAtRaw || typeof votingClosesAtRaw !== 'string') {
    throw new ApiError('VALIDATION_ERROR', 'votingClosesAt은 필수입니다.');
  }

  const votingClosesAt = new Date(votingClosesAtRaw);
  if (Number.isNaN(votingClosesAt.getTime())) {
    throw new ApiError(
      'VALIDATION_ERROR',
      'votingClosesAt 형식이 올바르지 않습니다.'
    );
  }

  // 트랜잭션 안에서 모임 상태·후보 수·약속시간 모두 재검증 (TOCTOU 방어)
  await prisma.$transaction(async (tx) => {
    const meeting = await tx.meeting.findUnique({
      where: { id: meetingId },
      select: { status: true, scheduledAt: true },
    });

    if (!meeting) {
      throw new ApiError('MEETING_NOT_FOUND', '모임을 찾을 수 없습니다.');
    }

    if (meeting.status !== 'RECRUITING') {
      throw new ApiError(
        'INVALID_MEETING_STATUS_TRANSITION',
        '투표는 모집 중인 모임에서만 시작할 수 있습니다.'
      );
    }

    const activeCount = await tx.placeCandidate.count({
      where: { meetingId, status: 'ACTIVE' },
    });

    if (activeCount < 1) {
      throw new ApiError(
        'INSUFFICIENT_CANDIDATES',
        '후보를 1곳 이상 담은 뒤 투표를 시작할 수 있습니다.'
      );
    }

    if (votingClosesAt.getTime() <= Date.now()) {
      throw new ApiError(
        'VALIDATION_ERROR',
        '투표 마감 시각은 현재 시각 이후로 설정해주세요.'
      );
    }

    if (
      meeting.scheduledAt &&
      votingClosesAt.getTime() > meeting.scheduledAt.getTime()
    ) {
      throw new ApiError(
        'VALIDATION_ERROR',
        '투표 마감 시각은 모임 약속 시간 이전으로 설정해주세요.'
      );
    }

    await transitionMeetingStatus(meetingId, 'VOTING', { tx });
    await tx.meeting.update({
      where: { id: meetingId },
      data: { votingClosesAt },
    });
  });

  socketEmitter
    .to(`meeting:${meetingId}`)
    .emit('meeting:status-changed', { meetingId, status: 'VOTING' });

  return apiSuccess({
    meetingId,
    status: 'VOTING' as const,
    votingClosesAt: votingClosesAt.toISOString(),
  });
});
