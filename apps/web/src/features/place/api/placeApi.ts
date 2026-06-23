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
