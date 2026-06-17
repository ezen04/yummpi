import { prisma } from '@/lib/prisma';
import { ApiError, apiSuccess, handleRoute } from '@/lib/api-response';

/**
 * GET /api/v1/meetings/invite/:inviteCode — 초대 링크 정보 (비로그인 허용)
 * 입장 페이지용 최소 공개 정보만 반환.
 */

type Ctx = { params: Promise<{ inviteCode: string }> };

export const GET = handleRoute(async (_req: Request, ctx: Ctx) => {
  const { inviteCode } = await ctx.params;

  const meeting = await prisma.meeting.findUnique({
    where: { inviteCode },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      scheduledAt: true,
      maxMembers: true,
      expiresAt: true,
      cancelledAt: true,
      host: { select: { nickname: true, name: true } },
      _count: { select: { members: true } },
    },
  });

  if (!meeting) {
    throw new ApiError('INVALID_INVITE_CODE', '유효하지 않은 초대 코드입니다.');
  }

  const expired =
    !!meeting.cancelledAt ||
    (!!meeting.expiresAt && meeting.expiresAt.getTime() < Date.now());

  return apiSuccess({
    id: meeting.id,
    title: meeting.title,
    description: meeting.description,
    status: meeting.status,
    scheduledAt: meeting.scheduledAt,
    maxMembers: meeting.maxMembers,
    memberCount: meeting._count.members,
    hostNickname: meeting.host.nickname ?? meeting.host.name ?? null,
    expired,
  });
});
