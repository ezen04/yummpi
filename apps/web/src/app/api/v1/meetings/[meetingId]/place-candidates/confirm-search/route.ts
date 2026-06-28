import { prisma } from '@/lib/prisma';
import { ApiError, apiSuccess, handleRoute } from '@/lib/api-response';
import { assertHost } from '@/lib/current-member';
import { transitionMeetingStatus } from '@/lib/meeting-status';
import { getSocketEmitter } from '@/lib/socket-emitter';
import { notifyMeetingMembers } from '@/lib/notify-meeting-members';
import type { MeetingStatus } from '@prisma/client';

const ALLOWED_STATUSES: MeetingStatus[] = ['VOTING', 'PLACE_CONFIRMED'];

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
    const member = await assertHost(meetingId);

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { status: true, title: true },
    });

    if (!meeting) {
      throw new ApiError('MEETING_NOT_FOUND', '모임을 찾을 수 없습니다.');
    }

    if (!ALLOWED_STATUSES.includes(meeting.status)) {
      throw new ApiError(
        'INVALID_MEETING_STATUS_TRANSITION',
        '장소 확정은 투표 중 또는 장소 확정 상태에서만 가능합니다.'
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

    let confirmedStatus: typeof meeting.status = meeting.status;

    const candidate = await prisma.$transaction(async (tx) => {
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
          '장소 확정은 투표 중 또는 장소 확정 상태에서만 가능합니다.'
        );
      }

      const existing = await tx.placeCandidate.findFirst({
        where: { meetingId, externalPlaceId },
        select: { id: true },
      });

      const saved = existing
        ? await tx.placeCandidate.update({
            where: { id: existing.id },
            data: {
              status: 'ACTIVE',
              name: body.name.trim(),
              categoryName: body.categoryName ?? null,
              address: body.address ?? null,
              roadAddress: body.roadAddress ?? null,
              phone: body.phone ?? null,
              latitude: body.lat,
              longitude: body.lng,
              placeUrl: body.placeUrl ?? null,
            },
          })
        : await tx.placeCandidate.create({
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
              status: 'ACTIVE',
            },
          });

      if (currentMeeting.status === 'VOTING') {
        await transitionMeetingStatus(meetingId, 'PLACE_CONFIRMED', { tx });
        await tx.meeting.update({
          where: { id: meetingId },
          data: { confirmedCandidateId: saved.id },
        });
        confirmedStatus = 'PLACE_CONFIRMED';
      } else {
        await tx.meeting.update({
          where: { id: meetingId },
          data: { confirmedCandidateId: saved.id },
        });
      }

      return saved;
    });

    const candidatePayload = {
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
    };

    getSocketEmitter().to(`meeting:${meetingId}`).emit('place:confirmed', {
      meetingId,
      candidateId: candidate.id,
      candidate: candidatePayload,
    });

    if (confirmedStatus === 'PLACE_CONFIRMED' && meeting.status === 'VOTING') {
      getSocketEmitter()
        .to(`meeting:${meetingId}`)
        .emit('meeting:status-changed', {
          meetingId,
          status: 'PLACE_CONFIRMED',
        });

      // P-2: VOTING → PLACE_CONFIRMED 최초 전환 시점에만 푸시.
      if (member.userId) {
        await notifyMeetingMembers({
          meetingId,
          excludeUserId: member.userId,
          category: 'MEETING',
          title: '모임 장소가 확정됐어요',
          body: `'${meeting.title}' 모임이 '${candidate.name}'(으)로 확정됐어요.`,
          url: `/meetings/${meetingId}`,
          dedupeKey: `place-confirmed.${meetingId}`,
        });
      }
    }

    return apiSuccess(
      {
        meetingId,
        candidateId: candidate.id,
        candidate: candidatePayload,
        meetingStatus: confirmedStatus,
      },
      '장소가 확정되었습니다.'
    );
  }
);
