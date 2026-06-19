import { prisma } from '@/lib/prisma';
import { ApiError, apiSuccess, handleRoute } from '@/lib/api-response';
import { assertHost } from '@/lib/current-member';
import { assertTransition } from '@/lib/meeting-status';
import { socketEmitter } from '@/lib/socket-emitter';

type Ctx = { params: Promise<{ meetingId: string; candidateId: string }> };

export const POST = handleRoute(async (_req: Request, { params }: Ctx) => {
  const { meetingId, candidateId } = await params;
  await assertHost(meetingId);

  const [meeting, candidate] = await Promise.all([
    prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { status: true },
    }),
    prisma.placeCandidate.findFirst({
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
    }),
  ]);

  if (!meeting) {
    throw new ApiError('MEETING_NOT_FOUND', '모임을 찾을 수 없습니다.');
  }

  if (!candidate) {
    throw new ApiError('VALIDATION_ERROR', '유효한 투표 후보가 아닙니다.');
  }

  if (meeting.status !== 'VOTING' && meeting.status !== 'PLACE_CONFIRMED') {
    assertTransition(meeting.status, 'PLACE_CONFIRMED');
  }

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

  if (meeting.status === 'VOTING') {
    await prisma.$transaction(async (tx) => {
      await tx.meeting.update({
        where: { id: meetingId },
        data: { status: 'PLACE_CONFIRMED', confirmedCandidateId: candidateId },
      });
    });

    socketEmitter.to(`meeting:${meetingId}`).emit('place:confirmed', {
      meetingId,
      candidateId,
      candidate: candidatePayload,
    });
    socketEmitter.to(`meeting:${meetingId}`).emit('meeting:status-changed', {
      meetingId,
      status: 'PLACE_CONFIRMED',
    });
  } else {
    await prisma.meeting.update({
      where: { id: meetingId },
      data: { confirmedCandidateId: candidateId },
    });

    socketEmitter.to(`meeting:${meetingId}`).emit('place:confirmed', {
      meetingId,
      candidateId,
      candidate: candidatePayload,
    });
  }

  return apiSuccess(
    { meetingId, candidateId, candidate: candidatePayload },
    '장소가 확정되었습니다.'
  );
});
