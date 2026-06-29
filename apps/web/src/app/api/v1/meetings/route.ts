import type { MeetingStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ApiError, apiSuccess, handleRoute } from '@/lib/api-response';
import { requireUser } from '@/lib/current-member';
import { generateInviteCode, inviteUrl } from '@/lib/invite-code';
import { MEETING_STATUSES } from '@/lib/meeting-status';
import {
  bad,
  optBool,
  optDate,
  optInt,
  optString,
  optStringArray,
  reqString,
} from '@/lib/meeting-input';

/**
 * POST /api/v1/meetings — 모임 생성 (회원). 생성 시 HOST 멤버 자동 생성.
 * GET  /api/v1/meetings — 내 모임 목록 (주최 + 회원으로 참여).
 */

async function uniqueInviteCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateInviteCode();
    const exists = await prisma.meeting.findUnique({
      where: { inviteCode: code },
      select: { id: true },
    });
    if (!exists) return code;
  }
  throw new ApiError('INTERNAL_ERROR', '초대 코드 생성에 실패했습니다.');
}

export const POST = handleRoute(async (req: Request) => {
  const user = await requireUser();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const data = {
    title: reqString(body.title, 'title', 1, 100),
    description: optString(body.description, 'description', 0, 1000),
    scheduledAt: optDate(body.scheduledAt, 'scheduledAt'),
    maxMembers: optInt(body.maxMembers, 'maxMembers'),
    budgetPerPerson: optInt(body.budgetPerPerson, 'budgetPerPerson'),
    foodTypes: optStringArray(body.foodTypes, 'foodTypes') ?? [],
    needParking: optBool(body.needParking, 'needParking') ?? false,
    needRoom: optBool(body.needRoom, 'needRoom') ?? false,
    anonymousVoting: optBool(body.anonymousVoting, 'anonymousVoting') ?? true,
    placeSearchRadiusM: optInt(body.placeSearchRadiusM, 'placeSearchRadiusM'),
    votingClosesAt: optDate(body.votingClosesAt, 'votingClosesAt'),
    expiresAt: optDate(body.expiresAt, 'expiresAt'),
  };

  const inviteCode = await uniqueInviteCode();
  const hostNickname = user.nickname ?? user.name ?? '호스트';

  // 모임 + HOST 멤버 자동 생성 (호스트 불변식) — 원자적
  const result = await prisma.$transaction(async (tx) => {
    const m = await tx.meeting.create({
      data: { ...data, hostUserId: user.id, inviteCode },
    });
    const hostMember = await tx.meetingMember.create({
      data: {
        meetingId: m.id,
        userId: user.id,
        nickname: hostNickname,
        role: 'HOST',
      },
      select: { id: true },
    });
    return {
      id: m.id,
      title: m.title,
      status: m.status,
      inviteCode: m.inviteCode,
      expiresAt: m.expiresAt,
      createdAt: m.createdAt,
      hostMemberId: hostMember.id,
    };
  });

  return apiSuccess(
    { ...result, inviteUrl: inviteUrl(result.inviteCode) },
    '모임이 생성되었습니다.',
    201
  );
});

export const GET = handleRoute(async (req: Request) => {
  const user = await requireUser();
  const { searchParams } = new URL(req.url);

  const statusParam = searchParams.get('status');
  let status: MeetingStatus | undefined;
  if (statusParam) {
    if (!MEETING_STATUSES.includes(statusParam as MeetingStatus)) {
      bad('status 값이 올바르지 않습니다.');
    }
    status = statusParam as MeetingStatus;
  }

  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number(searchParams.get('limit')) || 20)
  );

  const where: Prisma.MeetingWhereInput = {
    // 소프트 삭제(취소)된 모임은 목록에서 제외 (DELETE = cancelledAt 기록).
    cancelledAt: null,
    OR: [
      { hostUserId: user.id },
      { members: { some: { userId: user.id, leftAt: null } } },
    ],
    ...(status ? { status } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.meeting.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.meeting.count({ where }),
  ]);

  return apiSuccess({ items, page, limit, total });
});
