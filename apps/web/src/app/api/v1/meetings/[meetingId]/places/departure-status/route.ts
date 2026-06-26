import { apiSuccess, handleRoute } from '@/lib/api-response';
import { requireMember } from '@/lib/current-member';
import { findNearestStation } from '@/features/place/utils/stationSearch';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/v1/meetings/:meetingId/places/departure-status
 * 멤버별 출발역 입력 현황 (입력대기 화면용). 좌표는 노출하지 않고 "입력했는지"만.
 */
type Ctx = { params: Promise<{ meetingId: string }> };

export const GET = handleRoute(async (_req: Request, ctx: Ctx) => {
  const { meetingId } = await ctx.params;
  await requireMember(meetingId);

  const members = await prisma.meetingMember.findMany({
    where: { meetingId, leftAt: null },
    select: {
      id: true,
      nickname: true,
      userId: true,
      startLatitude: true,
      startLongitude: true,
      startStation: true,
    },
    orderBy: { joinedAt: 'asc' },
  });

  const list = members.map((m) => {
    const hasInput = m.startLatitude != null && m.startLongitude != null;
    let station = m.startStation ?? null;
    if (hasInput && !station) {
      const near = findNearestStation({
        lat: Number(m.startLatitude),
        lng: Number(m.startLongitude),
      });
      station = near ? `${near.name}역` : null;
    }
    return {
      memberId: m.id,
      nickname: m.nickname,
      isGuest: m.userId == null,
      hasInput,
      station,
    };
  });

  const inputCount = list.filter((m) => m.hasInput).length;

  return apiSuccess({
    members: list,
    inputCount,
    total: list.length,
    allInput: list.length > 0 && inputCount === list.length,
  });
});
