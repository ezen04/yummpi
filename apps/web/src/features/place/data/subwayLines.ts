// ⚠️ 자동 생성 파일 — 직접 수정 금지 (scripts로 재생성)
// 출처: KoreaMetroGraph(서울교통공사 노선별 역사 정보 기반)
// 수도권 전철 노선 정보: 표시명 + 배지 + 공식 노선색

export interface LineInfo {
  /** 전체 노선명 (예: "신분당선") */
  name: string;
  /** 배지 표기 — 숫자 호선은 숫자, 그 외는 축약명 */
  badge: string;
  /** 공식 노선색 (HEX) */
  color: string;
}

/** 호선 코드 → 노선 정보 */
export const LINE_INFO: Record<string, LineInfo> = {
  '1': { name: '1호선', badge: '1', color: '#0052A4' },
  '2': { name: '2호선', badge: '2', color: '#00A84D' },
  '3': { name: '3호선', badge: '3', color: '#EF7C1C' },
  '4': { name: '4호선', badge: '4', color: '#00A5DE' },
  '5': { name: '5호선', badge: '5', color: '#996CAC' },
  '6': { name: '6호선', badge: '6', color: '#CD7C2F' },
  '7': { name: '7호선', badge: '7', color: '#747F00' },
  '8': { name: '8호선', badge: '8', color: '#E6186C' },
  '9': { name: '9호선', badge: '9', color: '#BDB092' },
  K: { name: '경의중앙선', badge: '경의중앙', color: '#77C4A3' },
  B: { name: '분당선', badge: '분당', color: '#FABE00' },
  SU: { name: '수인선', badge: '수인', color: '#FABE00' },
  S: { name: '신분당선', badge: '신분당', color: '#D4003B' },
  G: { name: '경춘선', badge: '경춘', color: '#0C8E72' },
  E: { name: '용인경전철', badge: '에버라인', color: '#6FB245' },
  U: { name: '의정부경전철', badge: '의정부', color: '#FDA600' },
  UI: { name: '우이신설선', badge: '우이신설', color: '#B0CE18' },
  A: { name: '공항철도', badge: '공항', color: '#0090D2' },
  W: { name: '서해선', badge: '서해', color: '#81A914' },
  KK: { name: '경강선', badge: '경강', color: '#003DA5' },
  M: { name: '인천공항자기부상철도', badge: '자기부상', color: '#FFCD12' },
  I: { name: '인천1호선', badge: '인천1', color: '#7CA8D5' },
  I2: { name: '인천2호선', badge: '인천2', color: '#ED8B00' },
};

/** 숫자 호선 여부 (UI 배지: 숫자=원형, 그 외=알약형) */
export function isNumericLine(code: string): boolean {
  return /^\d+$/.test(code);
}
