import { prisma } from '@/lib/prisma';
import { ApiError, apiSuccess, handleRoute } from '@/lib/api-response';
import { assertHost, requireMember } from '@/lib/current-member';
import { optString, optInt, optDate, optEnum } from '@/lib/meeting-input';

/**
 * 예약 관리 API §8 — POST(생성, 호스트) · GET(조회, 멤버).
 *
 * MVP 수동 기록: 외부(카카오 등) 예약 연동이 아니다. 호스트가 오프라인으로 잡은 예약을
 * 수동 기록하고 모임원이 상태를 확인한다.
 * `placeCandidateId`는 바디로 받지 않고 서버가 `meeting.confirmedCandidateId`에서 도출한다
 * (교차무결성 + 확정 게이트를 한 번에 처리).
 */

type Ctx = { params: Promise<{ meetingId: string }> };

const RESERVATION_STATUSES = ['NONE', 'PENDING', 'DONE'] as const;

interface ReservationBody {
  reservationName?: unknown;
  reservationAt?: unknown;
  partySize?: unknown;
  confirmationNumber?: unknown;
  memo?: unknown;
  status?: unknown;
}

export const GET = handleRoute(async (_req: Request, ctx: Ctx) => {
  const { meetingId } = await ctx.params;
  await requireMember(meetingId); // 회원+게스트 모두 조회 가능
  const reservation = await prisma.reservation.findUnique({
    where: { meetingId },
  });
  return apiSuccess(reservation); // 없으면 data: null
});

export const POST = handleRoute(async (req: Request, ctx: Ctx) => {
  const { meetingId } = await ctx.params;

  // 존재 확인을 권한 검사보다 먼저: 없는 모임은 403이 아니라 404로.
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: { id: true, confirmedCandidateId: true },
  });
  if (!meeting) {
    throw new ApiError('MEETING_NOT_FOUND', '모임을 찾을 수 없습니다.');
  }
  await assertHost(meetingId);

  // 확정 장소가 있어야 예약 기록 가능 (확정 게이트).
  if (!meeting.confirmedCandidateId) {
    throw new ApiError(
      'INVALID_MEETING_STATUS_TRANSITION',
      '장소 확정 후에 예약을 기록할 수 있습니다.'
    );
  }

  // 모임당 1건 (meetingId UNIQUE).
  const existing = await prisma.reservation.findUnique({
    where: { meetingId },
  });
  if (existing) {
    throw new ApiError(
      'RESERVATION_ALREADY_EXISTS',
      '이미 예약이 등록되어 있습니다.'
    );
  }

  const body = (await req.json().catch(() => ({}))) as ReservationBody;
  const reservation = await prisma.reservation.create({
    data: {
      meetingId,
      placeCandidateId: meeting.confirmedCandidateId,
      status: optEnum(body.status, 'status', RESERVATION_STATUSES) ?? 'NONE',
      reservationName:
        optString(body.reservationName, 'reservationName', 1, 50) ?? null,
      reservationAt: optDate(body.reservationAt, 'reservationAt') ?? null,
      partySize: optInt(body.partySize, 'partySize') ?? null,
      confirmationNumber:
        optString(body.confirmationNumber, 'confirmationNumber', 1, 50) ?? null,
      memo: optString(body.memo, 'memo', 1, 500) ?? null,
    },
  });

  return apiSuccess(reservation, '예약 정보가 등록되었습니다.', 201);
});
