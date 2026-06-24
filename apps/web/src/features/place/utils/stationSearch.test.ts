import { describe, it, expect } from 'vitest';
import {
  searchStations,
  toLineRows,
  searchStationLineRows,
} from './stationSearch';

describe('searchStations', () => {
  it('빈 검색어는 빈 배열', () => {
    expect(searchStations('')).toEqual([]);
    expect(searchStations('   ')).toEqual([]);
  });

  it('"강남" 검색 시 강남역이 포함된다', () => {
    const names = searchStations('강남').map((s) => s.name);
    expect(names).toContain('강남');
  });

  it('"역" 접미사를 붙여도 동일하게 검색된다', () => {
    const a = searchStations('강남').map((s) => s.name);
    const b = searchStations('강남역').map((s) => s.name);
    expect(b).toContain('강남');
    expect(a[0]).toBe(b[0]);
  });

  it('접두 일치가 포함 일치보다 앞에 온다', () => {
    // "역삼"으로 시작하는 역이 "삼"만 포함된 역보다 앞
    const results = searchStations('강남');
    const idx = results.findIndex((s) => s.name === '강남');
    expect(idx).toBeGreaterThanOrEqual(0);
    // 강남으로 시작하는 역들이 앞쪽에 배치
    expect(results[0].name.startsWith('강남')).toBe(true);
  });

  it('limit으로 결과 개수를 제한한다', () => {
    expect(searchStations('역', 3).length).toBeLessThanOrEqual(3);
  });
});

describe('toLineRows', () => {
  it('환승역은 호선 수만큼 행으로 펼쳐진다', () => {
    const gangnam = searchStations('강남').find((s) => s.name === '강남')!;
    const rows = toLineRows(gangnam);
    // 강남 = 2호선 + 신분당선
    expect(rows.length).toBe(2);
    expect(rows[0].stationName).toBe('강남역');
    expect(rows.map((r) => r.lineLabel)).toContain('2');
    expect(rows.map((r) => r.lineLabel)).toContain('신분당');
  });

  it('각 행은 노선 색을 포함한다', () => {
    const gangnam = searchStations('강남').find((s) => s.name === '강남')!;
    const line2 = toLineRows(gangnam).find((r) => r.lineLabel === '2')!;
    expect(line2.lineColor).toBe('#00A84D');
  });
});

describe('searchStationLineRows', () => {
  it('검색어 → 행 목록을 바로 반환한다', () => {
    const rows = searchStationLineRows('강남');
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]).toHaveProperty('stationName');
    expect(rows[0]).toHaveProperty('lineLabel');
    expect(rows[0]).toHaveProperty('lineColor');
  });
});
