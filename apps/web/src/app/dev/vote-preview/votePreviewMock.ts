import type { RecommendationItem } from '@/features/place/api/placeApi';
import type { MeetingDetail } from '@/features/vote/hooks/useMeetingDetail';
import type { VoteCandidate, VotesData } from '@/hooks/useVote';

export const MOCK_MEETING_ID = 'preview-meeting-id';
export const MOCK_VIEWER_MEMBER_ID = 'preview-member-id';

const oneHourLater = new Date(Date.now() + 3600_000).toISOString();
const oneDayLater = new Date(Date.now() + 86400_000).toISOString();

export const MOCK_MEETING: MeetingDetail = {
  id: MOCK_MEETING_ID,
  title: '강남역 모임 (DEV PREVIEW)',
  status: 'RECRUITING',
  scheduledAt: oneDayLater,
  votingClosesAt: oneHourLater,
  departureInputClosesAt: null,
  anonymousVoting: true,
  confirmedCandidateId: null,
  budgetPerPerson: 25000,
  foodTypes: ['고기'],
  host: {
    memberId: 'm-1',
    nickname: '지훈',
    startStation: '강남역',
    startLatitude: '37.498',
    startLongitude: '127.028',
  },
};

const MOCK_CANDIDATES: VoteCandidate[] = [
  {
    id: 'cand-1',
    externalPlaceId: 'kakao-1',
    name: '강남 화로상회',
    categoryName: '음식점 > 한식 > 고기 > 삼겹살',
    address: '서울 강남구 강남대로 102길 8',
    roadAddress: null,
    phone: '02-555-1234',
    lat: '37.498',
    lng: '127.028',
    distanceM: 320,
    placeUrl: null,
    status: 'ACTIVE',
    createdBy: { memberId: 'm-1', nickname: '지훈', isHost: true },
    voteCount: 4,
    voteRate: 50,
    voterMemberIds: [],
  },
  {
    id: 'cand-2',
    externalPlaceId: 'kakao-2',
    name: '미도인 강남점',
    categoryName: '음식점 > 한식 > 덮밥',
    address: '서울 강남구 봉은사로 6길 21',
    roadAddress: null,
    phone: '02-555-5678',
    lat: '37.500',
    lng: '127.030',
    distanceM: 450,
    placeUrl: null,
    status: 'ACTIVE',
    createdBy: { memberId: 'm-2', nickname: '수민', isHost: false },
    voteCount: 3,
    voteRate: 38,
    voterMemberIds: [],
  },
  {
    id: 'cand-3',
    externalPlaceId: 'kakao-3',
    name: '쿠우쿠우 강남',
    categoryName: '음식점 > 뷔페 > 초밥뷔페',
    address: '서울 강남구 강남대로 396',
    roadAddress: null,
    phone: null,
    lat: '37.497',
    lng: '127.027',
    distanceM: 280,
    placeUrl: null,
    status: 'ACTIVE',
    createdBy: { memberId: 'm-3', nickname: '재현', isHost: false },
    voteCount: 1,
    voteRate: 13,
    voterMemberIds: [],
  },
  {
    id: 'cand-4',
    externalPlaceId: 'kakao-4',
    name: '하카타 분코',
    categoryName: '음식점 > 일식 > 라멘',
    address: '서울 강남구 테헤란로 4길 12',
    roadAddress: null,
    phone: '02-555-9999',
    lat: '37.499',
    lng: '127.029',
    distanceM: 610,
    placeUrl: null,
    status: 'ACTIVE',
    createdBy: { memberId: 'm-4', nickname: '도윤', isHost: false },
    voteCount: 0,
    voteRate: 0,
    voterMemberIds: [],
  },
];

const oneHourAgo = new Date(Date.now() - 3600_000).toISOString();

export function buildMockVotes(
  candidateCount: number,
  options: {
    myVoteIndex?: number | null;
    tied?: boolean;
    closed?: boolean;
  } = {}
): VotesData {
  const sourceCandidates = options.tied
    ? // 동률 시나리오: 1·2번 후보 모두 4표
      MOCK_CANDIDATES.map((c, i) =>
        i === 1 ? { ...c, voteCount: 4, voteRate: 50 } : c
      )
    : MOCK_CANDIDATES;

  const candidates = sourceCandidates.slice(
    0,
    Math.min(Math.max(candidateCount, 0), MOCK_CANDIDATES.length)
  );
  const myVoteIndex = options.myVoteIndex;
  const myCandidateId =
    myVoteIndex != null && candidates[myVoteIndex]
      ? candidates[myVoteIndex].id
      : null;

  const votingClosesAt = options.closed ? oneHourAgo : oneHourLater;

  return {
    isAnonymous: true,
    votingClosesAt,
    confirmedCandidateId: null,
    myCandidateId,
    totalVoters: 8,
    votedMemberCount: candidates.reduce((sum, c) => sum + c.voteCount, 0),
    candidates,
  };
}

export const MOCK_VOTES: VotesData = buildMockVotes(4);

export const MOCK_RECOMMENDATIONS: RecommendationItem[] = [
  {
    externalPlaceId: 'kakao-1',
    name: '강남 화로상회',
    categoryName: '음식점 > 한식 > 고기 > 삼겹살',
    address: '서울 강남구 강남대로 102길 8',
    roadAddress: null,
    phone: '02-555-1234',
    lat: '37.498',
    lng: '127.028',
    placeUrl: null,
    distanceM: 320,
  },
  {
    externalPlaceId: 'kakao-2',
    name: '미도인 강남점',
    categoryName: '음식점 > 한식 > 덮밥',
    address: '서울 강남구 봉은사로 6길 21',
    roadAddress: null,
    phone: '02-555-5678',
    lat: '37.500',
    lng: '127.030',
    placeUrl: null,
    distanceM: 450,
  },
  {
    externalPlaceId: 'kakao-5',
    name: '맘스터치 강남점',
    categoryName: '음식점 > 패스트푸드 > 햄버거',
    address: '서울 강남구 강남대로 392',
    roadAddress: null,
    phone: null,
    lat: '37.501',
    lng: '127.026',
    placeUrl: null,
    distanceM: 180,
  },
  {
    externalPlaceId: 'kakao-6',
    name: '스타벅스 강남R점',
    categoryName: '음식점 > 카페 > 커피전문점',
    address: '서울 강남구 테헤란로 152',
    roadAddress: null,
    phone: '02-555-7777',
    lat: '37.499',
    lng: '127.031',
    placeUrl: null,
    distanceM: 420,
  },
  {
    externalPlaceId: 'kakao-7',
    name: '하카타 분코',
    categoryName: '음식점 > 일식 > 라멘',
    address: '서울 강남구 테헤란로 4길 12',
    roadAddress: null,
    phone: '02-555-9999',
    lat: '37.499',
    lng: '127.029',
    placeUrl: null,
    distanceM: 610,
  },
];
