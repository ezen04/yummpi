import { ApiError, apiSuccess, handleRoute } from '@/lib/api-response';
import { requireUser } from '@/lib/current-member';

const KAKAO_KEYWORD_URL =
  'https://dapi.kakao.com/v2/local/search/keyword.json';

interface KakaoDocument {
  id: string;
  place_name: string;
  category_name: string;
  address_name: string;
  road_address_name: string;
  phone: string;
  x: string;
  y: string;
  place_url: string;
}

interface KakaoResponse {
  documents: KakaoDocument[];
  meta: { is_end: boolean };
}

export const GET = handleRoute(async (req: Request) => {
  await requireUser();
  const { searchParams } = new URL(req.url);

  const query = searchParams.get('query') ?? '';
  const x = searchParams.get('x');
  const y = searchParams.get('y');
  const radius = searchParams.get('radius');
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  if (!query.trim()) {
    return apiSuccess({ items: [], page, hasNext: false });
  }

  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) {
    throw new Error('KAKAO_REST_API_KEY가 설정되지 않았습니다.');
  }

  const params = new URLSearchParams({
    query,
    page: String(page),
    size: '15',
  });
  if (x) params.set('x', x);
  if (y) params.set('y', y);
  if (radius) {
    const radiusNum = Number(radius);
    if (isNaN(radiusNum) || radiusNum < 1 || radiusNum > 20000) {
      throw new ApiError('VALIDATION_ERROR', 'radius는 1~20000 사이 정수여야 합니다.');
    }
    params.set('radius', radius);
  }

  const res = await fetch(`${KAKAO_KEYWORD_URL}?${params}`, {
    headers: { Authorization: `KakaoAK ${apiKey}` },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new ApiError('KAKAO_API_FAILED', '카카오 장소 검색에 실패했습니다.');
  }

  const kakao = (await res.json()) as KakaoResponse;

  const items = kakao.documents.map((d) => ({
    externalPlaceId: d.id,
    name: d.place_name,
    categoryName: d.category_name || null,
    address: d.address_name || null,
    roadAddress: d.road_address_name || null,
    phone: d.phone || null,
    lat: d.y,
    lng: d.x,
    placeUrl: d.place_url || null,
  }));

  return apiSuccess({ items, page, hasNext: !kakao.meta.is_end });
});
