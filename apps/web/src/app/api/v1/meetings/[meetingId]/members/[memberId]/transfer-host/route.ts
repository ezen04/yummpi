import { prisma } from '@/lib/prisma';
import { ApiError, apiSuccess, handleRoute } from '@/lib/api-response';
import { requireMember } from '@/lib/current-member';
import { assertMembersUnlocked } from '@/lib/member-lock';

/**
 * POST /api/v1/meetings/:meetingId/members/:memberId/transfer-host
 * 방장(호스트) 권한을 대상 멤버에게 위임한다. 호스트만 호출 가능.
 *
 * 호스트 불변식(항상 정확히 1명) — 원자적 스왑으로만 변경:
 *   meeting.hostUserId → 대상 userId · 기존 호스트 role → MEMBER · 대상 role → HOST
 * 대상은 회원(userId 존재)만 가능 — 게스트는 users 미생성이라 호스트가 될 수 없다.
 */

type Ctx = { params: Promise<{ meetingId: string; memberId: string }> };

export const POST = handleRoute(async (_req: Request, ctx: Ctx) => {
  const { meetingId, memberId } = await ctx.params;

  const me = await requireMember(meetingId);
  if (me.role !== 'HOST') {
    throw new ApiError('FORBIDDEN', '주최자만 권한을 위임할 수 있습니다.');
  }
  // 정산 시작 후 방장 변경 차단(④ — ITEM_BASED 흡수자 호스트가 바뀌면 계산 깨짐).
  await assertMembersUnlocked(meetingId);
  if (me.id === memberId) {
    throw new ApiError('FORBIDDEN', '본인에게는 위임할 수 없습니다.');
  }

  const target = await prisma.meetingMember.findFirst({
    where: { id: memberId, meetingId, leftAt: null },
    select: { id: true, role: true, userId: true },
  });
  if (!target) {
    throw new ApiError('MEMBER_NOT_FOUND', '참석자를 찾을 수 없습니다.');
  }
  if (target.role === 'HOST') {
    throw new ApiError('FORBIDDEN', '이미 주최자입니다.');
  }
  // 게스트(userId NULL)는 호스트가 될 수 없다.
  if (!target.userId) {
    throw new ApiError('FORBIDDEN', '게스트에게는 권한을 위임할 수 없습니다.');
  }

  // 원자적 스왑 — 중간 상태(호스트 0명/2명) 없이 한 번에.
  await prisma.$transaction([
    prisma.meeting.update({
      where: { id: meetingId },
      data: { hostUserId: target.userId },
    }),
    prisma.meetingMember.update({
      where: { id: me.id },
      data: { role: 'MEMBER' },
    }),
    prisma.meetingMember.update({
      where: { id: target.id },
      data: { role: 'HOST' },
    }),
  ]);

  return apiSuccess(
    { meetingId, hostMemberId: target.id },
    '주최자 권한을 위임했습니다.'
  );
});
