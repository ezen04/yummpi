import { prisma } from '@/lib/prisma';
import { ApiError, apiSuccess, handleRoute } from '@/lib/api-response';
import { assertHost, requireMember } from '@/lib/current-member';
import type { MeetingStatus } from '@prisma/client';

const MAX_CANDIDATES = 5;

export const GET = handleRoute(
  async (_req: Request, { params }: { params: Promise<{ meetingId: string }> }) => {
    const { meetingId } = await params;
    const member = await requireMember(meetingId);

    const [meeting, candidates, myVote, votedMemberCount] = await Promise.all([
      prisma.meeting.findUnique({
        where: { id: meetingId },
        select: {
          confirmedCandidateId: true,
          members: {
            where: { leftAt: null },
            select: { id: true },
          },
        },
      }),
      prisma.placeCandidate.findMany({
        where: { meetingId },
        include: {
          createdBy: {
            select: { id: true, nickname: true, role: true },
          },
          _count: {
            select: { votes: true },
          },
        },
        orderBy: [
          { votes: { _count: 'desc' } },
          { createdAt: 'asc' },
        ],
      }),
      prisma.vote.findFirst({
        where: { meetingId, memberId: member.id },
        select: { candidateId: true },
      }),
      prisma.vote.count({
        where: { meetingId },
      }),
    ]);

    if (!meeting) {
      throw new ApiError('MEETING_NOT_FOUND', '모임을 찾을 수 없습니다.');
    }

    const totalVoters = meeting.members.length;

    return apiSuccess({
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
          totalVoters > 0 ? Math.round((c._count.votes / totalVoters) * 100) : 0,
      })),
    });
  }
);

const ALLOWED_STATUSES: MeetingStatus[] = ['RECRUITING', 'VOTING'];

interface PostBody {
  externalPlaceId: string;
  name: string;
  categoryName?: string | null;
  address?: string | null;
  roadAddress?: string | null;
  phone?: string | null;
  lat: string;
  lng: string;
  placeUrl?: string | null;
}

export const POST = handleRoute(
  async (req: Request, { params }: { params: Promise<{ meetingId: string }> }) => {
    const { meetingId } = await params;
    const member = await assertHost(meetingId);

    const [meeting, candidateCount] = await Promise.all([
      prisma.meeting.findUnique({
        where: { id: meetingId },
        select: { status: true },
      }),
      prisma.placeCandidate.count({ where: { meetingId } }),
    ]);
    if (!meeting) {
      throw new ApiError('MEETING_NOT_FOUND', '모임을 찾을 수 없습니다.');
    }
    if (!ALLOWED_STATUSES.includes(meeting.status)) {
      throw new ApiError(
        'INVALID_MEETING_STATUS_TRANSITION',
        '후보 추가는 모집 중 또는 투표 중 상태에서만 가능합니다.'
      );
    }
    if (candidateCount >= MAX_CANDIDATES) {
      throw new ApiError('VALIDATION_ERROR', `후보는 최대 ${MAX_CANDIDATES}개까지 추가할 수 있습니다.`);
    }

    const body = (await req.json()) as PostBody;

    if (!body.externalPlaceId?.trim() || !body.name?.trim()) {
      throw new ApiError('VALIDATION_ERROR', 'externalPlaceId와 name은 필수입니다.');
    }
    if (!body.lat || !body.lng) {
      throw new ApiError('VALIDATION_ERROR', '좌표(lat, lng)는 필수입니다.');
    }

    let candidate;
    try {
      candidate = await prisma.placeCandidate.create({
        data: {
          meetingId,
          createdByMemberId: member.id,
          externalPlaceId: body.externalPlaceId.trim(),
          name: body.name.trim(),
          categoryName: body.categoryName ?? null,
          address: body.address ?? null,
          roadAddress: body.roadAddress ?? null,
          phone: body.phone ?? null,
          latitude: body.lat,
          longitude: body.lng,
          placeUrl: body.placeUrl ?? null,
        },
        include: {
          createdBy: {
            select: { id: true, nickname: true, role: true },
          },
        },
      });
    } catch (err: unknown) {
      // meetingId + externalPlaceId UNIQUE 제약 위반
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code: string }).code === 'P2002'
      ) {
        throw new ApiError('CANDIDATE_ALREADY_EXISTS', '이미 추가된 장소입니다.');
      }
      throw err;
    }

    return apiSuccess(
      {
        id: candidate.id,
        externalPlaceId: candidate.externalPlaceId,
        name: candidate.name,
        categoryName: candidate.categoryName,
        address: candidate.address,
        roadAddress: candidate.roadAddress,
        phone: candidate.phone,
        lat: candidate.latitude,
        lng: candidate.longitude,
        placeUrl: candidate.placeUrl,
        status: candidate.status,
        createdBy: candidate.createdBy
          ? {
              memberId: candidate.createdBy.id,
              nickname: candidate.createdBy.nickname,
              isHost: candidate.createdBy.role === 'HOST',
            }
          : null,
        voteCount: 0,
        createdAt: candidate.createdAt,
      },
      '장소 후보가 추가되었습니다.',
      201
    );
  }
);
