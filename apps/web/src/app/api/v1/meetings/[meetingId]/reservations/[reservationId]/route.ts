import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ApiError, apiSuccess, handleRoute } from '@/lib/api-response';
import { assertHost } from '@/lib/current-member';
import { bad, optString, optInt, optDate, optEnum } from '@/lib/meeting-input';

/**
 * 예약 관리 API §8 — PATCH(수정·상태) · DELETE(삭제). 둘 다 호스트 전용.
 * reservationId가 해당 모임 예약이 아니면 404 RESERVATION_NOT_FOUND.
 */

type Ctx = { params: Promise<{ meetingId: string; reservationId: string }> };

const RESERVATION_STATUSES = ['NONE', 'PENDING', 'DONE'] as const;

interface PatchBody {
  reservationName?: unknown;
  reservationAt?: unknown;
  partySize?: unknown;
  confirmationNumber?: unknown;
  memo?: unknown;
  status?: unknown;
}

export const PATCH = handleRoute(async (req: Request, ctx: Ctx) => {
  const { meetingId, reservationId } = await ctx.params;
  await assertHost(meetingId);

  const existing = await prisma.reservation.findFirst({
    where: { id: reservationId, meetingId },
    select: { id: true },
  });
  if (!existing) {
    throw new ApiError('RESERVATION_NOT_FOUND', '예약을 찾을 수 없습니다.');
  }

  const body = (await req.json().catch(() => ({}))) as PatchBody;

  const data: Prisma.ReservationUpdateInput = {};
  const status = optEnum(body.status, 'status', RESERVATION_STATUSES);
  if (status !== undefined) data.status = status;
  const reservationName = optString(
    body.reservationName,
    'reservationName',
    1,
    50
  );
  if (reservationName !== undefined) data.reservationName = reservationName;
  const reservationAt = optDate(body.reservationAt, 'reservationAt');
  if (reservationAt !== undefined) data.reservationAt = reservationAt;
  const partySize = optInt(body.partySize, 'partySize');
  if (partySize !== undefined) data.partySize = partySize;
  const confirmationNumber = optString(
    body.confirmationNumber,
    'confirmationNumber',
    1,
    50
  );
  if (confirmationNumber !== undefined) {
    data.confirmationNumber = confirmationNumber;
  }
  const memo = optString(body.memo, 'memo', 1, 500);
  if (memo !== undefined) data.memo = memo;

  if (Object.keys(data).length === 0) {
    bad('수정할 필드가 없습니다.');
  }

  const updated = await prisma.reservation.update({
    where: { id: reservationId },
    data,
  });

  return apiSuccess(updated, '예약 정보가 수정되었습니다.');
});

export const DELETE = handleRoute(async (_req: Request, ctx: Ctx) => {
  const { meetingId, reservationId } = await ctx.params;
  await assertHost(meetingId);

  const existing = await prisma.reservation.findFirst({
    where: { id: reservationId, meetingId },
    select: { id: true },
  });
  if (!existing) {
    throw new ApiError('RESERVATION_NOT_FOUND', '예약을 찾을 수 없습니다.');
  }

  await prisma.reservation.delete({ where: { id: reservationId } });
  return apiSuccess({ id: reservationId }, '예약이 삭제되었습니다.');
});
