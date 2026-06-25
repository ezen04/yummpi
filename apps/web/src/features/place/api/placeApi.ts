export interface RecommendationItem {
  externalPlaceId: string;
  name: string;
  categoryName: string | null;
  address: string | null;
  roadAddress: string | null;
  phone: string | null;
  lat: string;
  lng: string;
  placeUrl: string | null;
  distanceM: number;
}

export interface AddCandidatePayload {
  externalPlaceId: string;
  name: string;
  categoryName: string | null;
  address: string | null;
  roadAddress: string | null;
  phone: string | null;
  lat: string;
  lng: string;
  placeUrl: string | null;
}

async function parseErrorMessage(res: Response, fallback: string) {
  const body = (await res.json().catch(() => ({}))) as {
    error?: { message?: string };
  };
  return body?.error?.message ?? fallback;
}

export interface OptimalPoint {
  lat: string;
  lng: string;
}

export async function fetchOptimalPoint(
  meetingId: string
): Promise<OptimalPoint> {
  const res = await fetch(
    `/api/v1/meetings/${meetingId}/places/optimal-point`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'COORDINATE' }),
    }
  );
  if (!res.ok) {
    throw new Error(
      await parseErrorMessage(res, '중간지점을 계산하지 못했습니다.')
    );
  }
  const body = (await res.json()) as {
    data: { latitude: number; longitude: number };
  };
  return { lat: String(body.data.latitude), lng: String(body.data.longitude) };
}

/** STATION 모드 결과 — 공평(최댓값 최소) 기준으로 선택된 최적 역. */
export interface OptimalStation {
  /** 표시용 역명 (예: "선릉역") */
  name: string;
  /** 원본 역명 ("역" 없음) */
  rawName: string;
  lat: string;
  lng: string;
  /** 호선 코드 목록 (배지 렌더용) */
  lines: string[];
  /** 가장 먼 참여자까지의 거리(m) — 이 값(최댓값)을 최소화한 결과 */
  maxDistanceM: number;
  /** 출발지 미입력으로 계산에서 제외된 인원 수 */
  excludedCount: number;
}

/**
 * 출발역 기반 최적 역(STATION 모드)을 계산한다.
 * 전체 역 중 "가장 먼 참여자까지의 거리(최댓값)"가 최소인 역을 반환한다.
 */
export async function fetchOptimalStation(
  meetingId: string
): Promise<OptimalStation> {
  const res = await fetch(
    `/api/v1/meetings/${meetingId}/places/optimal-point`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'STATION' }),
    }
  );
  if (!res.ok) {
    throw new Error(
      await parseErrorMessage(res, '최적 역을 계산하지 못했습니다.')
    );
  }
  const body = (await res.json()) as {
    data: {
      nearestStation: {
        name: string;
        rawName: string;
        lat: number;
        lng: number;
        lines: string[];
      };
      maxDistanceM: number;
      excludedCount: number;
    };
  };
  const s = body.data.nearestStation;
  return {
    name: s.name,
    rawName: s.rawName,
    lat: String(s.lat),
    lng: String(s.lng),
    lines: s.lines,
    maxDistanceM: body.data.maxDistanceM,
    excludedCount: body.data.excludedCount,
  };
}

export async function fetchPlaceRecommendations(
  meetingId: string,
  lat: string,
  lng: string
): Promise<RecommendationItem[]> {
  const url = `/api/v1/meetings/${meetingId}/place-recommendations?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      await parseErrorMessage(res, '추천 장소를 불러올 수 없습니다.')
    );
  }
  const body = (await res.json()) as { data: { items: RecommendationItem[] } };
  return body.data.items;
}

export async function addPlaceCandidate(
  meetingId: string,
  payload: AddCandidatePayload
): Promise<void> {
  const res = await fetch(`/api/v1/meetings/${meetingId}/place-candidates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(
      await parseErrorMessage(res, '후보로 추가하지 못했습니다.')
    );
  }
}

export async function rejectPlaceCandidate(
  meetingId: string,
  candidateId: string
): Promise<void> {
  const res = await fetch(
    `/api/v1/meetings/${meetingId}/place-candidates/${candidateId}/reject`,
    { method: 'POST' }
  );
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, '후보 제외에 실패했습니다.'));
  }
}

export async function addPlaceSuggestion(
  meetingId: string,
  payload: AddCandidatePayload
): Promise<void> {
  const res = await fetch(`/api/v1/meetings/${meetingId}/place-suggestions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(
      await parseErrorMessage(res, '장소 풀 추가에 실패했습니다.')
    );
  }
}

export interface SuggestionItem {
  id: string;
  externalPlaceId: string | null;
  name: string;
  categoryName: string | null;
  address: string | null;
  roadAddress: string | null;
  phone: string | null;
  lat: string;
  lng: string;
  placeUrl: string | null;
}

export async function fetchPlaceSuggestions(
  meetingId: string
): Promise<SuggestionItem[]> {
  const res = await fetch(`/api/v1/meetings/${meetingId}/place-suggestions`);
  if (!res.ok) {
    throw new Error(
      await parseErrorMessage(res, '장소 풀을 불러올 수 없습니다.')
    );
  }
  const body = (await res.json()) as { data: { items: SuggestionItem[] } };
  return body.data.items;
}

export interface SearchPlacesParams {
  meetingId: string;
  query: string;
  x?: string;
  y?: string;
  radius?: number;
  page?: number;
}

export async function searchPlaces(
  params: SearchPlacesParams
): Promise<RecommendationItem[]> {
  const search = new URLSearchParams({
    meetingId: params.meetingId,
    query: params.query,
  });
  if (params.x) search.set('x', params.x);
  if (params.y) search.set('y', params.y);
  if (params.radius != null) search.set('radius', String(params.radius));
  if (params.page != null) search.set('page', String(params.page));

  const res = await fetch(`/api/v1/places/search?${search.toString()}`);
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, '장소 검색에 실패했습니다.'));
  }
  const body = (await res.json()) as {
    data: { items: RecommendationItem[] };
  };
  return body.data.items;
}
