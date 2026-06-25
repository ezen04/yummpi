import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ApiError, apiSuccess, handleRoute } from '@/lib/api-response';
import { requireMember } from '@/lib/current-member';
import { socketEmitter } from '@/lib/socket-emitter';
import type { MeetingStatus } from '@prisma/client';

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
  async (
    req: Request,
    { params }: { params: Promise<{ meetingId: string }> }
  ) => {
    const { meetingId } = await params;
    const member = await requireMember(meetingId);

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { status: true },
    });

    if (!meeting) {
      throw new ApiError('MEETING_NOT_FOUND', '모임을 찾을 수 없습니다.');
    }

    if (!ALLOWED_STATUSES.includes(meeting.status)) {
      throw new ApiError(
        'INVALID_MEETING_STATUS_TRANSITION',
        '장소 풀 추가는 모집 중 또는 투표 중 상태에서만 가능합니다.'
      );
    }

    const body = (await req.json()) as PostBody;

    if (!body.externalPlaceId?.trim() || !body.name?.trim()) {
      throw new ApiError(
        'VALIDATION_ERROR',
        'externalPlaceId와 name은 필수입니다.'
      );
    }
    if (!body.lat || !body.lng) {
      throw new ApiError('VALIDATION_ERROR', '좌표(lat, lng)는 필수입니다.');
    }

    const externalPlaceId = body.externalPlaceId.trim();

    const suggestion = await prisma
      .$transaction(async (tx) => {
        const currentMeeting = await tx.meeting.findUnique({
          where: { id: meetingId },
          select: { status: true },
        });

        if (
          !currentMeeting ||
          !ALLOWED_STATUSES.includes(currentMeeting.status)
        ) {
          throw new ApiError(
            'INVALID_MEETING_STATUS_TRANSITION',
            '장소 풀 추가는 모집 중 또는 투표 중 상태에서만 가능합니다.'
          );
        }

        const existing = await tx.placeCandidate.findFirst({
          where: { meetingId, externalPlaceId },
          select: { id: true, status: true },
        });

        if (existing) {
          throw new ApiError(
            'CANDIDATE_ALREADY_EXISTS',
            existing.status === 'ACTIVE'
              ? '이미 투표 후보로 등록된 장소입니다.'
              : '이미 장소 풀에 추가된 장소입니다.'
          );
        }

        return tx.placeCandidate.create({
          data: {
            meetingId,
            createdByMemberId: member.id,
            externalPlaceId,
            name: body.name.trim(),
            categoryName: body.categoryName ?? null,
            address: body.address ?? null,
            roadAddress: body.roadAddress ?? null,
            phone: body.phone ?? null,
            latitude: body.lat,
            longitude: body.lng,
            placeUrl: body.placeUrl ?? null,
            status: 'REJECTED',
          },
          include: {
            createdBy: {
              select: { id: true, nickname: true, role: true },
            },
          },
        });
      })
      .catch((err: unknown) => {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002'
        ) {
          throw new ApiError(
            'CANDIDATE_ALREADY_EXISTS',
            '이미 장소 풀에 추가된 장소입니다.'
          );
        }
        throw err;
      });

    // 풀(REJECTED) 추가도 RecruitingView의 통합 리스트에 영향 → 클라이언트 invalidate 트리거
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
    socketEmitter.to(`meeting:${meetingId}`).emit('vote:updated', {
      meetingId,
      candidateId: suggestion.id,
      voteCounts,
      votedMemberCount,
      updatedBy: member.id,
    });

    return apiSuccess(
      {
        id: suggestion.id,
        externalPlaceId: suggestion.externalPlaceId,
        name: suggestion.name,
        categoryName: suggestion.categoryName,
        address: suggestion.address,
        roadAddress: suggestion.roadAddress,
        phone: suggestion.phone,
        lat: suggestion.latitude,
        lng: suggestion.longitude,
        placeUrl: suggestion.placeUrl,
        createdBy: suggestion.createdBy
          ? {
              memberId: suggestion.createdBy.id,
              nickname: suggestion.createdBy.nickname,
              isHost: suggestion.createdBy.role === 'HOST',
            }
          : null,
      },
      '장소 풀에 추가되었습니다.',
      201
    );
  }
);

export const GET = handleRoute(
  async (
    _req: Request,
    { params }: { params: Promise<{ meetingId: string }> }
  ) => {
    const { meetingId } = await params;
    await requireMember(meetingId);

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { id: true },
    });

    if (!meeting) {
      throw new ApiError('MEETING_NOT_FOUND', '모임을 찾을 수 없습니다.');
    }

    const suggestions = await prisma.placeCandidate.findMany({
      where: { meetingId, status: 'REJECTED' },
      include: {
        createdBy: {
          select: { id: true, nickname: true, role: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return apiSuccess({
      items: suggestions.map((s) => ({
        id: s.id,
        externalPlaceId: s.externalPlaceId,
        name: s.name,
        categoryName: s.categoryName,
        address: s.address,
        roadAddress: s.roadAddress,
        phone: s.phone,
        lat: s.latitude,
        lng: s.longitude,
        placeUrl: s.placeUrl,
        createdBy: s.createdBy
          ? {
              memberId: s.createdBy.id,
              nickname: s.createdBy.nickname,
              isHost: s.createdBy.role === 'HOST',
            }
          : null,
      })),
    });
  }
);
