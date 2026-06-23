import type { RecommendationItem } from '@/features/place/api/placeApi';

export interface MemberDistance {
  memberId: string;
  nickname: string;
  distanceM: number | null;
  excluded: boolean;
}

export interface OptimalPointData {
  optimizationType: string;
  latitude: number;
  longitude: number;
  totalDistanceM: number;
  maxDistanceM: number;
  excludedCount: number;
  memberDistances: MemberDistance[];
}

// POST /api/v1/meetings/:id/places/optimal-point 응답 mock
export const MOCK_OPTIMAL_POINT: OptimalPointData = {
  optimizationType: 'MIN_MAX_DISTANCE',
  latitude: 37.5172,
  longitude: 127.0473,
  totalDistanceM: 5800,
  maxDistanceM: 2400,
  excludedCount: 1,
  memberDistances: [
    {
      memberId: 'm-1',
      nickname: '지훈',
      distanceM: 1200,
      excluded: false,
    },
    {
      memberId: 'm-2',
      nickname: '민지',
      distanceM: 2200,
      excluded: false,
    },
    {
      memberId: 'm-3',
      nickname: '수현',
      distanceM: 2400,
      excluded: false,
    },
    {
      memberId: 'm-4',
      nickname: '예린',
      distanceM: null,
      excluded: true,
    },
  ],
};

// GET /api/v1/meetings/:id/place-recommendations 응답 mock
export const MOCK_RECOMMENDATIONS: RecommendationItem[] = [
  {
    externalPlaceId: 'kakao-1',
    name: '강남 화로상회',
    categoryName: '음식점 > 한식 > 고기',
    address: '서울 강남구 강남대로 102길 8',
    roadAddress: '서울 강남구 강남대로 102길 8',
    phone: '02-555-1234',
    lat: '37.5168',
    lng: '127.0451',
    placeUrl: null,
    distanceM: 320,
  },
  {
    externalPlaceId: 'kakao-2',
    name: '역삼 스시조',
    categoryName: '음식점 > 일식 > 초밥',
    address: '서울 강남구 역삼로 207',
    roadAddress: '서울 강남구 역삼로 207',
    phone: '02-333-5678',
    lat: '37.5181',
    lng: '127.0488',
    placeUrl: null,
    distanceM: 610,
  },
  {
    externalPlaceId: 'kakao-3',
    name: '카페 드롭탑 역삼점',
    categoryName: '카페 > 커피',
    address: '서울 강남구 테헤란로 151',
    roadAddress: '서울 강남구 테헤란로 151',
    phone: null,
    lat: '37.5162',
    lng: '127.0469',
    placeUrl: null,
    distanceM: 870,
  },
  {
    externalPlaceId: 'kakao-4',
    name: '역삼 파스타하우스',
    categoryName: '음식점 > 양식 > 파스타',
    address: '서울 강남구 역삼동 832-1',
    roadAddress: '서울 강남구 역삼로 13길 4',
    phone: '02-777-9012',
    lat: '37.5155',
    lng: '127.0491',
    placeUrl: null,
    distanceM: 1120,
  },
];
