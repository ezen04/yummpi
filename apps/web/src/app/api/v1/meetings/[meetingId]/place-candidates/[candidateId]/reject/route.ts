import { prisma } from '@/lib/prisma';
import { ApiError, apiSuccess, handleRoute } from '@/lib/api-response';
import { assertHost } from '@/lib/current-member';
import { getSocketEmitter } from '@/lib/socket-emitter';

/**
 * POST /api/v1/meetings/[meetingId]/place-candidates/[candidateId]/reject
 *
 * 호스트가 ACTIVE 투표 후보를 풀(REJECTED)로 강등(투표 후보에서 제외).
 * RECRUITING 상태에서만 허용 (VOTING 진입 후엔 vote 행이 달려 있어 변경 불가).
 * 확정된 후보(meeting.confirmedCandidateId)는 강등 불가.
 *
 * 변경 후 ACTIVE 후보 카운트 재집계 + `vote:updated` broadcast.
 */
export const POST = handleRoute(
  async (
    _req: Request,
    {
      params,
    }: {
      params: Promise<{ meetingId: string; candidateId: string }>;
    }
  ) => {
    const { meetingId, candidateId } = await params;
    const member = await assertHost(meetingId);

    await prisma.$transaction(async (tx) => {
      const meeting = await tx.meeting.findUnique({
        where: { id: meetingId },
        select: { status: true, confirmedCandidateId: true },
      });
      if (!meeting) {
        throw new ApiError('MEETING_NOT_FOUND', '모임을 찾을 수 없습니다.');
      }
      if (meeting.status !== 'RECRUITING') {
        throw new ApiError(
          'INVALID_MEETING_STATUS_TRANSITION',
          '후보 제외는 모집 중 상태에서만 가능합니다.'
        );
      }
      if (meeting.confirmedCandidateId === candidateId) {
        throw new ApiError(
          'ALREADY_CONFIRMED_PLACE',
          '확정된 장소는 제외할 수 없습니다.'
        );
      }

      const candidate = await tx.placeCandidate.findFirst({
        where: { id: candidateId, meetingId, status: 'ACTIVE' },
        select: { id: true },
      });
      if (!candidate) {
        throw new ApiError(
          'CANDIDATE_NOT_FOUND',
          '투표 후보를 찾을 수 없습니다.'
        );
      }

      await tx.placeCandidate.update({
        where: { id: candidateId },
        data: { status: 'REJECTED' },
      });
    });

    const [activeCandidates, votedMemberCount] = await Promise.all([
      prisma.placeCandidate.findMany({
        where: { meetingId, status: 'ACTIVE' },
        select: { id: true, _count: { select: { votes: true } } },
      }),
      prisma.vote.count({ where: { meetingId } }),
    ]);

    const voteCounts = Object.fromEntries(
      activeCandidates.map((c) => [c.id, c._count.votes])
    );

    getSocketEmitter().to(`meeting:${meetingId}`).emit('vote:updated', {
      meetingId,
      candidateId,
      voteCounts,
      votedMemberCount,
      updatedBy: member.id,
    });

    return apiSuccess({ id: candidateId, status: 'REJECTED' });
  }
);
