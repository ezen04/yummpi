// 중간지점("최적 장소") 미리보기용 mock
// POST /api/v1/meetings/:id/places/optimal-point 응답 형태를 가정한다.
// 이 화면은 장소추천·멤버별 거리를 다루지 않는다. (중간지점 + 참여 출발역만)

export interface MemberStation {
  memberId: string;
  nickname: string;
  /** 출발역. null 이면 미입력 → 중간지점 계산에서 제외 */
  station: string | null;
  excluded: boolean;
}

export interface OptimalPointData {
  /** 최적화 기준 (총 이동 거리 최소화 등) */
  optimizationType: string;
  latitude: number;
  longitude: number;
  /** 지도 말풍선에 표시할 인근 지명 ("선릉역 부근") */
  placeLabel: string;
  members: MemberStation[];
}

// 선릉역 부근을 중간지점으로 가정 (강남·신논현·교대·방배 4개 역 기준)
export const MOCK_OPTIMAL_POINT: OptimalPointData = {
  optimizationType: 'MIN_TOTAL_DISTANCE',
  latitude: 37.5045,
  longitude: 127.0492,
  placeLabel: '선릉역 부근',
  members: [
    { memberId: 'm-1', nickname: '지훈', station: '강남역', excluded: false },
    { memberId: 'm-2', nickname: '민지', station: '신논현역', excluded: false },
    { memberId: 'm-3', nickname: '수현', station: '교대역', excluded: false },
    { memberId: 'm-4', nickname: '예린', station: '방배역', excluded: false },
  ],
};
