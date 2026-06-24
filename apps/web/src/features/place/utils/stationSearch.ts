import { SUBWAY_STATIONS, type SubwayStation } from '../data/subwayStations';
import { LINE_INFO } from '../data/subwayLines';

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
