import { prisma } from '@/lib/prisma';
import { ApiError, apiSuccess, handleRoute } from '@/lib/api-response';
import { requireMember } from '@/lib/current-member';

const KAKAO_KEYWORD_URL = 'https://dapi.kakao.com/v2/local/search/keyword.json';
const DEFAULT_RADIUS_M = 1000;
const MAX_RESULTS = 10;

interface KakaoDocument {
  id: string;
  place_name: string;
  category_name: string;
  /** 카카오 카테고리 그룹 코드 — 'FD6'(음식점) · 'CE7'(카페) 등. 식당 필터 핵심 키. */
  category_group_code: string;
  address_name: string;
  road_address_name: string;
  phone: string;
  x: string; // 경도(longitude)
  y: string; // 위도(latitude)
  place_url: string;
  distance: string; // x/y 전달 시 미터 단위 문자열로 반환
}

interface KakaoResponse {
  documents: KakaoDocument[];
}

/**
 * 모임 식당 종류(영문 key 또는 한글) → 카카오 카테고리 그룹 코드.
 * 카페는 별도 그룹(CE7), 나머지 식당류는 음식점(FD6).
 * "고기" 같은 키워드를 그냥 검색하면 한의원·마사지가 섞여 나오므로 group code로 강제 필터.
 */
function toKakaoGroupCode(foodType: string): 'FD6' | 'CE7' {
  if (foodType === 'cafe' || foodType === '카페') return 'CE7';
  return 'FD6';
}

const ALLOWED_GROUP_CODES = new Set(['FD6', 'CE7']);

async function searchKakaoByCategory(
  query: string,
  x: string,
  y: string,
  radius: number,
  apiKey: string
): Promise<KakaoDocument[]> {
  const params = new URLSearchParams({
    query,
    x,
    y,
    radius: String(radius),
    size: '15',
    sort: 'distance',
    // 1차 필터: 카카오 측에서 카테고리 그룹으로 제한 (한의원·약국 등 자연스럽게 제외)
    category_group_code: toKakaoGroupCode(query),
  });

  const res = await fetch(`${KAKAO_KEYWORD_URL}?${params}`, {
    headers: { Authorization: `KakaoAK ${apiKey}` },
    next: { revalidate: 0 },
  });

  if (!res.ok) return [];

  const data = (await res.json()) as KakaoResponse;
  // 2차 안전망: 카카오 응답에 일관성 없는 케이스 차단
  return (data.documents ?? []).filter((d) =>
    ALLOWED_GROUP_CODES.has(d.category_group_code)
  );
}

export const GET = handleRoute(
  async (
    req: Request,
    { params }: { params: Promise<{ meetingId: string }> }
  ) => {
    const { meetingId } = await params;
    await requireMember(meetingId);

    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!lat || !lng) {
      throw new ApiError('VALIDATION_ERROR', 'lat과 lng은 필수입니다.');
    }

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { foodTypes: true, placeSearchRadiusM: true },
    });

    if (!meeting) {
      throw new ApiError('MEETING_NOT_FOUND', '모임을 찾을 수 없습니다.');
    }

    const apiKey = process.env.KAKAO_REST_API_KEY;
    if (!apiKey) {
      throw new Error('KAKAO_REST_API_KEY가 설정되지 않았습니다.');
    }

    const radius = meeting.placeSearchRadiusM ?? DEFAULT_RADIUS_M;
    // foodTypes가 비어있으면 '음식점' 전체로 fallback
    const categories =
      meeting.foodTypes.length > 0 ? meeting.foodTypes : ['음식점'];

    // 카카오 API: x = 경도(lng), y = 위도(lat)
    let allResults: Awaited<ReturnType<typeof searchKakaoByCategory>>[];
    try {
      allResults = await Promise.all(
        categories.map((category) =>
          searchKakaoByCategory(category, lng, lat, radius, apiKey)
        )
      );
    } catch {
      throw new ApiError(
        'KAKAO_API_FAILED',
        '카카오 장소 검색에 실패했습니다.'
      );
    }

    // 중복 제거(externalPlaceId 기준) → 거리순 정렬 → 상위 10개
    const seen = new Set<string>();
    const items = allResults
      .flat()
      .filter((doc) => {
        if (seen.has(doc.id)) return false;
        seen.add(doc.id);
        return true;
      })
      .sort((a, b) => Number(a.distance) - Number(b.distance))
      .slice(0, MAX_RESULTS)
      .map((d) => ({
        externalPlaceId: d.id,
        name: d.place_name,
        categoryName: d.category_name || null,
        address: d.address_name || null,
        roadAddress: d.road_address_name || null,
        phone: d.phone || null,
        lat: d.y,
        lng: d.x,
        placeUrl: d.place_url || null,
        distanceM: Number(d.distance) || 0,
      }));

    return apiSuccess({ items });
  }
);
