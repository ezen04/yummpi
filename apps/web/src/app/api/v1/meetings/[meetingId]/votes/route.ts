import { prisma } from '@/lib/prisma';
import { ApiError, apiSuccess, handleRoute } from '@/lib/api-response';
import { requireMember } from '@/lib/current-member';
import { socketEmitter } from '@/lib/socket-emitter';

interface PutBody {
  candidateId: string;
}

export const PUT = handleRoute(
  async (
    req: Request,
    { params }: { params: Promise<{ meetingId: string }> }
  ) => {
    const { meetingId } = await params;
    const member = await requireMember(meetingId);

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { status: true, votingClosesAt: true },
    });

    if (!meeting) {
      throw new ApiError('MEETING_NOT_FOUND', '모임을 찾을 수 없습니다.');
    }

    if (meeting.status !== 'VOTING') {
      throw new ApiError(
        'INVALID_MEETING_STATUS_TRANSITION',
        '투표는 투표 중 상태에서만 가능합니다.'
      );
    }

    if (meeting.votingClosesAt && new Date() > meeting.votingClosesAt) {
      throw new ApiError('VOTING_CLOSED', '투표가 마감되었습니다.');
    }

    const body = (await req.json()) as PutBody;

    if (!body.candidateId?.trim()) {
      throw new ApiError('VALIDATION_ERROR', 'candidateId는 필수입니다.');
    }

    const { updatedCandidates, votedMemberCount } = await prisma.$transaction(
      async (tx) => {
        const currentMeeting = await tx.meeting.findUnique({
          where: { id: meetingId },
          select: { status: true, votingClosesAt: true },
        });

        if (!currentMeeting) {
          throw new ApiError('MEETING_NOT_FOUND', '모임을 찾을 수 없습니다.');
        }

        if (currentMeeting.status !== 'VOTING') {
          throw new ApiError(
            'INVALID_MEETING_STATUS_TRANSITION',
            '투표는 투표 중 상태에서만 가능합니다.'
          );
        }

        if (
          currentMeeting.votingClosesAt &&
          new Date() > currentMeeting.votingClosesAt
        ) {
          throw new ApiError('VOTING_CLOSED', '투표가 마감되었습니다.');
        }

        const candidate = await tx.placeCandidate.findFirst({
          where: { id: body.candidateId, meetingId, status: 'ACTIVE' },
          select: { id: true },
        });

        if (!candidate) {
          throw new ApiError(
            'VALIDATION_ERROR',
            '유효한 투표 후보가 아닙니다.'
          );
        }

        await tx.vote.upsert({
          where: { meetingId_memberId: { meetingId, memberId: member.id } },
          update: { candidateId: body.candidateId },
          create: {
            meetingId,
            memberId: member.id,
            candidateId: body.candidateId,
          },
        });

        const [candidates, memberCount] = await Promise.all([
          tx.placeCandidate.findMany({
            where: { meetingId, status: 'ACTIVE' },
            select: { id: true, _count: { select: { votes: true } } },
          }),
          tx.vote.count({ where: { meetingId } }),
        ]);

        return { updatedCandidates: candidates, votedMemberCount: memberCount };
      }
    );

    const voteCounts = Object.fromEntries(
      updatedCandidates.map((c) => [c.id, c._count.votes])
    );

    socketEmitter.to(`meeting:${meetingId}`).emit('vote:updated', {
      meetingId,
      candidateId: body.candidateId,
      voteCounts,
      votedMemberCount,
      updatedBy: member.id,
    });

    return apiSuccess({
      myCandidateId: body.candidateId,
      candidates: updatedCandidates.map((c) => ({
        id: c.id,
        voteCount: c._count.votes,
      })),
    });
  }
);

export const GET = handleRoute(
  async (
    _req: Request,
    { params }: { params: Promise<{ meetingId: string }> }
  ) => {
    const { meetingId } = await params;
    const member = await requireMember(meetingId);

    const [meeting, candidates, myVote, votedMemberCount] = await Promise.all([
      prisma.meeting.findUnique({
        where: { id: meetingId },
        select: {
          confirmedCandidateId: true,
          votingClosesAt: true,
          anonymousVoting: true,
          members: {
            where: { leftAt: null },
            select: { id: true },
          },
        },
      }),
      prisma.placeCandidate.findMany({
        where: { meetingId, status: 'ACTIVE' },
        include: {
          createdBy: {
            select: { id: true, nickname: true, role: true },
          },
          _count: {
            select: { votes: true },
          },
          votes: {
            select: { memberId: true },
          },
        },
        orderBy: [{ votes: { _count: 'desc' } }, { createdAt: 'asc' }],
      }),
      prisma.vote.findFirst({
        where: { meetingId, memberId: member.id },
        select: { candidateId: true },
      }),
      prisma.vote.count({ where: { meetingId } }),
    ]);

    if (!meeting) {
      throw new ApiError('MEETING_NOT_FOUND', '모임을 찾을 수 없습니다.');
    }

    const totalVoters = meeting.members.length;

    return apiSuccess({
      isAnonymous: meeting.anonymousVoting,
      votingClosesAt: meeting.votingClosesAt,
      confirmedCandidateId: meeting.confirmedCandidateId,
      myCandidateId: myVote?.candidateId ?? null,
      totalVoters,
      votedMemberCount,
      candidates: candidates.map((c) => ({
        id: c.id,
        externalPlaceId: c.externalPlaceId,
        name: c.name,
        categoryName: c.categoryName,
        address: c.address,
        roadAddress: c.roadAddress,
        phone: c.phone,
        lat: c.latitude,
        lng: c.longitude,
        distanceM: null,
        placeUrl: c.placeUrl,
        status: c.status,
        createdBy: c.createdBy
          ? {
              memberId: c.createdBy.id,
              nickname: c.createdBy.nickname,
              isHost: c.createdBy.role === 'HOST',
            }
          : null,
        voteCount: c._count.votes,
        voteRate:
          totalVoters > 0
            ? Math.round((c._count.votes / totalVoters) * 100)
            : 0,
        voterMemberIds: meeting.anonymousVoting
          ? []
          : c.votes.map((v) => v.memberId),
      })),
    });
  }
);
