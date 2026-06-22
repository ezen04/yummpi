import { ApiError, apiSuccess, handleRoute } from '@/lib/api-response';
import { requireMember } from '@/lib/current-member';
import { calcDistance, calcMidpoint } from '@/lib/haversine';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/v1/meetings/:meetingId/places/optimal-point — 중간지점 계산
 *
 * mode: "COORDINATE" (기본) — 멤버 출발 좌표 평균
 * mode: "STATION"           — 지하철역 기반 (P1, 미구현)
 */

type Ctx = { params: Promise<{ meetingId: string }> };

interface RequestBody {
  mode?: 'COORDINATE' | 'STATION';
  optimizationType?: string;
}

export const POST = handleRoute(async (req: Request, ctx: Ctx) => {
  const { meetingId } = await ctx.params;
  await requireMember(meetingId);

  const body = (await req.json().catch(() => ({}))) as RequestBody;
  const mode = body.mode ?? 'COORDINATE';

  if (mode === 'STATION') {
    throw new ApiError(
      'VALIDATION_ERROR',
      'STATION 모드는 아직 지원하지 않습니다.'
    );
  }

  const members = await prisma.meetingMember.findMany({
    where: { meetingId },
    select: {
      id: true,
      nickname: true,
      startLatitude: true,
      startLongitude: true,
    },
  });

  const coords = members.map((m) =>
    m.startLatitude != null && m.startLongitude != null
      ? { lat: Number(m.startLatitude), lng: Number(m.startLongitude) }
      : null
  );

  const midpoint = calcMidpoint(coords);

  if (!midpoint) {
    throw new ApiError(
      'VALIDATION_ERROR',
      '출발지를 입력한 멤버가 없어 중간지점을 계산할 수 없습니다.'
    );
  }

  const memberDistances = members.map((m, i) => {
    const coord = coords[i];
    return {
      memberId: m.id,
      nickname: m.nickname,
      distanceM: coord ? Math.round(calcDistance(coord, midpoint)) : null,
      excluded: coord === null,
    };
  });

  const includedDistances = memberDistances
    .map((d) => d.distanceM)
    .filter((d): d is number => d !== null);

  const totalDistanceM = includedDistances.reduce((sum, d) => sum + d, 0);
  const maxDistanceM =
    includedDistances.length > 0 ? Math.max(...includedDistances) : 0;

  return apiSuccess({
    optimizationType: body.optimizationType ?? 'MIN_MAX_DISTANCE',
    latitude: midpoint.lat,
    longitude: midpoint.lng,
    nearestStation: null,
    totalDistanceM,
    maxDistanceM,
    excludedCount: midpoint.excludedCount,
    memberDistances,
  });
});
