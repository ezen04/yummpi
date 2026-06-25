import { ApiError, apiSuccess, handleRoute } from '@/lib/api-response';
import { requireMember } from '@/lib/current-member';
import { calcDistance, calcMidpoint, type Coord } from '@/lib/haversine';
import { findOptimalStation } from '@/features/place/utils/stationSearch';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/v1/meetings/:meetingId/places/optimal-point — 최적 지점 계산
 *
 * mode: "COORDINATE" (기본) — 멤버 출발 좌표 평균(중간점)
 * mode: "STATION"           — 지하철역 기반. 전체 역 중 "가장 먼 멤버까지의 거리(최댓값)"가
 *                             최소인 역을 직접 선택(공평 기준). 추상 중간점을 거치지 않음.
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
  const validCoords = coords.filter((c): c is Coord => c != null);
  const excludedCount = coords.length - validCoords.length;

  if (validCoords.length === 0) {
    throw new ApiError(
      'VALIDATION_ERROR',
      '출발지를 입력한 멤버가 없어 최적 지점을 계산할 수 없습니다.'
    );
  }

  // ── STATION 모드: 공평(최댓값 최소) 기준으로 최적 역 직접 선택 ──
  if (mode === 'STATION') {
    const optimal = findOptimalStation(validCoords);
    if (!optimal) {
      throw new ApiError('VALIDATION_ERROR', '최적 역을 계산할 수 없습니다.');
    }
    const { station, maxDistanceM } = optimal;
    return apiSuccess({
      optimizationType: 'MIN_MAX_DISTANCE',
      latitude: station.lat,
      longitude: station.lng,
      nearestStation: {
        name: `${station.name}역`,
        rawName: station.name,
        lat: station.lat,
        lng: station.lng,
        lines: station.lines,
      },
      maxDistanceM,
      excludedCount,
    });
  }

  // ── COORDINATE 모드: 좌표 평균(중간점) ──
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
