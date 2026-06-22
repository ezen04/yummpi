export interface Coord {
  lat: number;
  lng: number;
}

export interface MidpointResult {
  lat: number;
  lng: number;
  /** 출발지 미입력으로 계산에서 제외된 인원 수 */
  excludedCount: number;
}

/**
 * 여러 출발지 좌표의 중간지점을 계산한다.
 * 한국 도시 내 거리에서는 위도/경도 평균의 오차가 무시할 수준이므로 단순 평균 사용.
 *
 * @returns 중간지점 좌표. 유효한 좌표가 0개면 null.
 */
const EARTH_RADIUS_M = 6_371_000;

/** 두 좌표 사이의 직선 거리를 미터 단위로 반환한다 (Haversine 공식). */
export function calcDistance(a: Coord, b: Coord): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const chord =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;
  return (
    2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(chord), Math.sqrt(1 - chord))
  );
}

export function calcMidpoint(
  coords: (Coord | null | undefined)[]
): MidpointResult | null {
  const valid = coords.filter((c): c is Coord => c != null);
  const excludedCount = coords.length - valid.length;

  if (valid.length === 0) return null;

  const sumLat = valid.reduce((sum, c) => sum + c.lat, 0);
  const sumLng = valid.reduce((sum, c) => sum + c.lng, 0);

  return {
    lat: sumLat / valid.length,
    lng: sumLng / valid.length,
    excludedCount,
  };
}
