import { prisma } from '@/lib/prisma';
import { ApiError, apiSuccess, handleRoute } from '@/lib/api-response';
import { requireMember } from '@/lib/current-member';
import { assertMembersUnlocked } from '@/lib/member-lock';

/**
 * POST /api/v1/meetings/:meetingId/attendance
 * 호스트가 참석자를 일괄 확정한다(정산 직전). 호스트만.
 *
 * body { attending: string[] }  — 참석 멤버 id 목록.
 * 활성 멤버(leftAt=null) 중 목록에 있으면 ATTENDING, 없으면 ABSENT.
 * 정산 참여자 소스 = attendanceStatus(ATTENDING) — ④ 정산 로직과 동일 기준.
 * 호스트는 정산 흡수자라 항상 ATTENDING으로 강제(방어).
 */

type Ctx = { params: Promise<{ meetingId: string }> };

export const POST = handleRoute(async (req: Request, ctx: Ctx) => {
  const { meetingId } = await ctx.params;

  const me = await requireMember(meetingId);
  if (me.role !== 'HOST') {
    throw new ApiError('FORBIDDEN', '주최자만 참석자를 확정할 수 있습니다.');
  }
  // 정산 시작 후 출석 일괄 변경 차단(④ — 참여자 집합 고정).
  await assertMembersUnlocked(meetingId);

  const body = (await req.json().catch(() => ({}))) as { attending?: unknown };
  if (
    !Array.isArray(body.attending) ||
    body.attending.some((x) => typeof x !== 'string')
  ) {
    throw new ApiError(
      'VALIDATION_ERROR',
      'attending은 문자열 배열이어야 합니다.'
    );
  }
  // 호스트는 항상 참석.
  const attendingIds = Array.from(
    new Set([...(body.attending as string[]), me.id])
  );

  await prisma.$transaction([
    prisma.meetingMember.updateMany({
      where: { meetingId, leftAt: null, id: { in: attendingIds } },
      data: { attendanceStatus: 'ATTENDING' },
    }),
    prisma.meetingMember.updateMany({
      where: { meetingId, leftAt: null, id: { notIn: attendingIds } },
      data: { attendanceStatus: 'ABSENT' },
    }),
  ]);

  return apiSuccess(
    { attending: attendingIds.length },
    '참석자를 확정했습니다.'
  );
});
