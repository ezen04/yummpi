import { prisma } from '@/lib/prisma';
import { ApiError, apiSuccess, handleRoute } from '@/lib/api-response';
import { assertHost } from '@/lib/current-member';
import {
  assertTransition,
  transitionMeetingStatus,
} from '@/lib/meeting-status';
import { getSocketEmitter } from '@/lib/socket-emitter';
import { notifyMeetingMembers } from '@/lib/notify-meeting-members';
import type { MeetingStatus } from '@prisma/client';

type Ctx = { params: Promise<{ meetingId: string; candidateId: string }> };

const ALLOWED_STATUSES: MeetingStatus[] = ['VOTING', 'PLACE_CONFIRMED'];

export const POST = handleRoute(async (_req: Request, { params }: Ctx) => {
  const { meetingId, candidateId } = await params;
  const host = await assertHost(meetingId);

  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: { status: true, title: true },
  });

  if (!meeting) {
    throw new ApiError('MEETING_NOT_FOUND', '모임을 찾을 수 없습니다.');
  }

  if (!ALLOWED_STATUSES.includes(meeting.status)) {
    assertTransition(meeting.status, 'PLACE_CONFIRMED');
  }

  let confirmedStatus: MeetingStatus = meeting.status;

  const candidate = await prisma.$transaction(async (tx) => {
    const currentMeeting = await tx.meeting.findUnique({
      where: { id: meetingId },
      select: { status: true },
    });

    if (!currentMeeting || !ALLOWED_STATUSES.includes(currentMeeting.status)) {
      throw new ApiError(
        'INVALID_MEETING_STATUS_TRANSITION',
        '허용되지 않는 모임 상태입니다.'
      );
    }

    const found = await tx.placeCandidate.findFirst({
      where: { id: candidateId, meetingId, status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        categoryName: true,
        address: true,
        roadAddress: true,
        phone: true,
        latitude: true,
        longitude: true,
        placeUrl: true,
        externalPlaceId: true,
      },
    });

    if (!found) {
      throw new ApiError('VALIDATION_ERROR', '유효한 투표 후보가 아닙니다.');
    }

    if (currentMeeting.status === 'VOTING') {
      await transitionMeetingStatus(meetingId, 'PLACE_CONFIRMED', { tx });
      await tx.meeting.update({
        where: { id: meetingId },
        data: { confirmedCandidateId: candidateId },
      });
      confirmedStatus = 'PLACE_CONFIRMED';
    } else {
      await tx.meeting.update({
        where: { id: meetingId },
        data: { confirmedCandidateId: candidateId },
      });
    }

    return found;
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
    candidateId,
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
    // 이후 장소 변경(PLACE_CONFIRMED → PLACE_CONFIRMED)은 dedupeKey가 동일해
    // worker의 멱등 처리로도 막히지만, 의도를 명확히 하기 위해 이 블록 안에 둠.
    if (host.userId) {
      await notifyMeetingMembers({
        meetingId,
        excludeUserId: host.userId,
        category: 'MEETING',
        title: '모임 장소가 확정됐어요',
        body: `'${meeting.title}' 모임이 '${candidate.name}'(으)로 확정됐어요.`,
        url: `/meetings/${meetingId}`,
        dedupeKey: `place-confirmed.${meetingId}`,
      });
    }
  }

  return apiSuccess(
    { meetingId, candidateId, candidate: candidatePayload },
    '장소가 확정되었습니다.'
  );
});
