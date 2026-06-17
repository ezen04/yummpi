import type { MeetingStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ApiError, apiSuccess, handleRoute } from '@/lib/api-response';
import { assertHost, requireMember } from '@/lib/current-member';
import { canTransition } from '@/lib/meeting-status';
import {
  optBool,
  optDate,
  optInt,
  optString,
  optStringArray,
} from '@/lib/meeting-input';

/**
 * GET    /api/v1/meetings/:meetingId — 상세 (멤버 전원)
 * PATCH  /api/v1/meetings/:meetingId — 수정 (호스트)
 * DELETE /api/v1/meetings/:meetingId — 소프트 삭제 (호스트, SETTLING 이후 불가)
 */

type Ctx = { params: Promise<{ meetingId: string }> };

// 익명 투표 설정 잠금 기준: VOTING 진입 후
const VOTING_ENTERED: ReadonlySet<MeetingStatus> = new Set<MeetingStatus>([
  'VOTING',
  'PLACE_CONFIRMED',
  'IN_PROGRESS',
  'SETTLING',
  'COMPLETED',
]);

export const GET = handleRoute(async (_req: Request, ctx: Ctx) => {
  const { meetingId } = await ctx.params;

  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: {
      members: true,
      placeCandidates: true,
      confirmedCandidate: true,
      reservation: true,
    },
  });
  if (!meeting) {
    throw new ApiError('MEETING_NOT_FOUND', '모임을 찾을 수 없습니다.');
  }

  await requireMember(meetingId); // 멤버만 조회 가능
  return apiSuccess(meeting);
});

export const PATCH = handleRoute(async (req: Request, ctx: Ctx) => {
  const { meetingId } = await ctx.params;

  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
  if (!meeting) {
    throw new ApiError('MEETING_NOT_FOUND', '모임을 찾을 수 없습니다.');
  }
  await assertHost(meetingId);

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  // 익명 투표 설정은 VOTING 진입 후 변경 불가
  const anonymousVoting = optBool(body.anonymousVoting, 'anonymousVoting');
  if (
    anonymousVoting !== undefined &&
    anonymousVoting !== meeting.anonymousVoting &&
    VOTING_ENTERED.has(meeting.status)
  ) {
    throw new ApiError(
      'VOTING_SETTING_LOCKED',
      'VOTING 진입 후에는 익명 투표 설정을 변경할 수 없습니다.'
    );
  }

  const data: Prisma.MeetingUpdateInput = {
    title: optString(body.title, 'title', 1, 100),
    description: optString(body.description, 'description', 0, 1000),
    scheduledAt: optDate(body.scheduledAt, 'scheduledAt'),
    maxMembers: optInt(body.maxMembers, 'maxMembers'),
    budgetPerPerson: optInt(body.budgetPerPerson, 'budgetPerPerson'),
    foodTypes: optStringArray(body.foodTypes, 'foodTypes'),
    needParking: optBool(body.needParking, 'needParking'),
    needRoom: optBool(body.needRoom, 'needRoom'),
    anonymousVoting,
    placeSearchRadiusM: optInt(body.placeSearchRadiusM, 'placeSearchRadiusM'),
    votingClosesAt: optDate(body.votingClosesAt, 'votingClosesAt'),
    expiresAt: optDate(body.expiresAt, 'expiresAt'),
  };

  const updated = await prisma.meeting.update({
    where: { id: meetingId },
    data,
  });
  return apiSuccess(updated, '모임이 수정되었습니다.');
});

export const DELETE = handleRoute(async (_req: Request, ctx: Ctx) => {
  const { meetingId } = await ctx.params;

  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
  if (!meeting) {
    throw new ApiError('MEETING_NOT_FOUND', '모임을 찾을 수 없습니다.');
  }
  await assertHost(meetingId);

  if (!canTransition(meeting.status, 'CANCELLED')) {
    throw new ApiError(
      'INVALID_MEETING_STATUS_TRANSITION',
      '정산 시작(SETTLING) 이후에는 모임을 삭제할 수 없습니다.'
    );
  }

  await prisma.meeting.update({
    where: { id: meetingId },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  });
  return apiSuccess(
    { id: meetingId, status: 'CANCELLED' },
    '모임이 취소되었습니다.'
  );
});
