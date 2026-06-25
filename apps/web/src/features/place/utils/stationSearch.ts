import { SUBWAY_STATIONS, type SubwayStation } from '../data/subwayStations';
import { LINE_INFO } from '../data/subwayLines';
import { calcDistance, type Coord } from '@/lib/haversine';

/** 검색 결과 한 줄 — (역 × 호선) 단위. UI 배지 1개에 대응. */
export interface StationLineRow {
  /** 표시용 역명 ("역" 접미사 포함, 예: "강남역") */
  stationName: string;
  /** 원본 역명 ("역" 없음, 데이터 키) */
  rawName: string;
  /** 호선 코드 (LINE_INFO 키) */
  lineCode: string;
  /** 배지 표기 ("2", "신분당" 등) */
  lineLabel: string;
  /** 노선 공식색 */
  lineColor: string;
  lat: number;
  lng: number;
}

/** 검색어 정규화 — 공백 제거 + 끝의 "역" 접미사 제거 */
function normalize(query: string): string {
  return query.replace(/\s+/g, '').replace(/역$/, '');
}

/**
 * 역명으로 지하철역을 검색한다.
 * 접두 일치를 포함 일치보다 우선한다.
 *
 * @param query 사용자 입력 (예: "강남", "강남역")
 * @param limit 최대 역 개수 (기본 20)
 */
export function searchStations(query: string, limit = 20): SubwayStation[] {
  const q = normalize(query);
  if (!q) return [];

  const prefix: SubwayStation[] = [];
  const partial: SubwayStation[] = [];
  for (const st of SUBWAY_STATIONS) {
    if (st.name === q || st.name.startsWith(q)) prefix.push(st);
    else if (st.name.includes(q)) partial.push(st);
  }
  return [...prefix, ...partial].slice(0, limit);
}

/** 역 하나를 호선별 결과 행으로 펼친다 (강남 → 2호선 행 + 신분당 행). */
export function toLineRows(station: SubwayStation): StationLineRow[] {
  return station.lines
    .filter((code) => LINE_INFO[code])
    .map((code) => {
      const info = LINE_INFO[code];
      return {
        stationName: `${station.name}역`,
        rawName: station.name,
        lineCode: code,
        lineLabel: info.badge,
        lineColor: info.color,
        lat: station.lat,
        lng: station.lng,
      };
    });
}

/**
 * 검색어로 (역 × 호선) 결과 행 목록을 반환한다.
 * DepartureSearchScreen 결과 리스트에 바로 렌더 가능.
 */
export function searchStationLineRows(
  query: string,
  limit = 20
): StationLineRow[] {
  return searchStations(query, limit).flatMap(toLineRows);
}

/** 최적 역 계산 결과. */
export interface OptimalStationResult {
  /** 선택된 최적 역 */
  station: SubwayStation;
  /** 그 역에서 가장 먼 멤버까지의 거리(m) — 이 값(최댓값)을 최소화한 결과 */
  maxDistanceM: number;
}

/**
 * 멤버 출발 좌표들을 받아, 모두에게 공평한 최적의 역을 찾는다.
 *
 * 기준 = "최댓값 최소"(공평): 후보 역마다 "가장 먼 멤버까지의 Haversine 거리"를
 * 점수로 매기고, 그 점수가 가장 작은 역을 고른다. (= 가장 먼 사람도 제일 안 먼 역)
 *
 * 추상적 중간점(평균 좌표)을 거치지 않고 전체 역을 직접 후보로 평가하므로,
 * "중간점이 빗나가 엉뚱한 역이 뽑히는" 2단계 오차가 없다.
 *
 * @param members 유효한 출발 좌표 목록 (미입력자는 호출 전에 제외)
 * @returns 최적 역 + 최댓값 거리. 좌표가 0개면 null.
 */
export function findOptimalStation(
  members: Coord[]
): OptimalStationResult | null {
  if (members.length === 0) return null;

  let best: SubwayStation | null = null;
  let bestMax = Infinity;

  for (const station of SUBWAY_STATIONS) {
    const here: Coord = { lat: station.lat, lng: station.lng };

    // 이 역에서 '가장 먼 멤버까지의 거리'(최댓값) = 이 역의 점수
    let maxDist = 0;
    for (const m of members) {
      const d = calcDistance(m, here);
      if (d > maxDist) maxDist = d;
    }

    // 점수(최댓값)가 더 작은 역이면 갱신
    if (maxDist < bestMax) {
      bestMax = maxDist;
      best = station;
    }
  }

  if (!best) return null;
  return { station: best, maxDistanceM: Math.round(bestMax) };
}

/** 좌표에서 가장 가까운 역을 찾는다. (출발좌표 → "참여한 역" 표시용) */
export function findNearestStation(coord: Coord): SubwayStation | null {
  let best: SubwayStation | null = null;
  let bestDist = Infinity;
  for (const station of SUBWAY_STATIONS) {
    const d = calcDistance(coord, { lat: station.lat, lng: station.lng });
    if (d < bestDist) {
      bestDist = d;
      best = station;
    }
  }
  return best;
}
