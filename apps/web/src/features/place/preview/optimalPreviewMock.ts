// 출발역 입력 → 중간지점 플로우 dev 미리보기용 mock
// 실제 API 연동 전, 화면 퍼블리싱 검증 목적. (역할 ② 영역)

// ── 토글 섹션 (화면 목록) ─────────────────────────────────────

export const PREVIEW_SECTIONS = [
  { id: 'place-undecided', label: '① 장소 미정' },
  { id: 'departure-input', label: '② 출발역 입력' },
  { id: 'departure-search', label: '③ 출발역 검색' },
  { id: 'wait-time', label: '④ 대기시간' },
  { id: 'waiting-input', label: '⑤ 입력 대기' },
  { id: 'all-done', label: '⑥ 입력 완료' },
  { id: 'midpoint', label: '⑦ 중간지점' },
] as const;

export type PreviewSection = (typeof PREVIEW_SECTIONS)[number]['id'];

// ── 멤버 (입력 대기 / 중간지점 화면 공용) ──────────────────────

export interface PreviewMember {
  memberId: string;
  nickname: string;
  isGuest: boolean;
  /** 입력한 출발역. null 이면 아직 입력 대기 */
  station: string | null;
  /** 아바타 배경색 (파스텔) */
  avatarBg: string;
  avatarText: string;
}

export const MOCK_MEMBERS: PreviewMember[] = [
  {
    memberId: 'm-1',
    nickname: '이강인',
    isGuest: false,
    station: '강남역',
    avatarBg: '#FFE2E2',
    avatarText: '#E15B5B',
  },
  {
    memberId: 'm-2',
    nickname: '박서연',
    isGuest: false,
    station: '신논현역',
    avatarBg: '#FFEFD6',
    avatarText: '#E0982E',
  },
  {
    memberId: 'm-3',
    nickname: '남남평건',
    isGuest: true,
    station: '교대역',
    avatarBg: '#E2F5E2',
    avatarText: '#4CA64C',
  },
  {
    memberId: 'm-4',
    nickname: '정하늘',
    isGuest: false,
    station: null,
    avatarBg: '#DFEBFF',
    avatarText: '#4C7FD4',
  },
  {
    memberId: 'm-5',
    nickname: '최민준',
    isGuest: false,
    station: null,
    avatarBg: '#F0E2FF',
    avatarText: '#9B5BD4',
  },
  {
    memberId: 'm-6',
    nickname: '바삭감자',
    isGuest: true,
    station: null,
    avatarBg: '#EAE6FF',
    avatarText: '#6E5BD4',
  },
];

/** 입력 마감까지 남은 시간 (시:분:초) — 정적 표시 */
export const MOCK_REMAINING = { h: 0, m: 46, s: 12 };

// ── 대기시간 설정 옵션 ────────────────────────────────────────

export const WAIT_OPTIONS = [
  '30분',
  '1시간',
  '2시간',
  '3시간',
  '직접설정',
] as const;

// ── 출발역 검색 결과 (지하철 노선 배지 포함) ──────────────────

export interface StationResult {
  name: string;
  lineLabel: string;
  lineBg: string;
}

export const MOCK_STATION_RESULTS: StationResult[] = [
  { name: '강남역', lineLabel: '2', lineBg: '#00A84D' },
  { name: '강남역', lineLabel: '신분당', lineBg: '#D4003B' },
];

// ── 중간지점 결과 ─────────────────────────────────────────────

export interface MidpointData {
  optimizationType: string;
  latitude: number;
  longitude: number;
  /** 지도 말풍선에 표시할 선택된 역 이름 */
  placeLabel: string;
  /** 가장 먼 참여자까지의 거리(m) — 이 값(최댓값)을 최소화한 결과 */
  maxDistanceM: number;
  /** 계산에 포함된 출발역 목록 */
  stations: string[];
}

export const MOCK_MIDPOINT: MidpointData = {
  optimizationType: 'MIN_MAX_DISTANCE',
  latitude: 37.5045,
  longitude: 127.0492,
  placeLabel: '선릉역',
  maxDistanceM: 3200,
  stations: ['강남역', '신논현역', '교대역', '방배역'],
};
