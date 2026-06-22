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
