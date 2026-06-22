'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { KakaoMap, type Marker } from '@/components/common/KakaoMap';

interface MemberDistance {
  memberId: string;
  nickname: string;
  distanceM: number | null;
  excluded: boolean;
}

interface OptimalPointData {
  latitude: number;
  longitude: number;
  excludedCount: number;
  memberDistances: MemberDistance[];
}

interface PlaceItem {
  externalPlaceId: string;
  name: string;
  categoryName: string;
  address: string;
  lat: number;
  lng: number;
  distanceM: number;
  placeUrl: string;
}

export default function OptimalPage() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const [midpoint, setMidpoint] = useState<OptimalPointData | null>(null);
  const [places, setPlaces] = useState<PlaceItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/v1/meetings/${meetingId}/places/optimal-point`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'COORDINATE' }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (!json.success) {
          setError(json.error?.message ?? '오류가 발생했어요');
          return;
        }
        const data = json.data as OptimalPointData;
        setMidpoint(data);

        // 중간지점 좌표로 추천 장소 요청
        return fetch(
          `/api/v1/meetings/${meetingId}/place-recommendations?lat=${data.latitude}&lng=${data.longitude}`
        )
          .then((res) => res.json())
          .then((rec) => {
            if (rec.success) setPlaces(rec.data.items ?? []);
          });
      })
      .catch(() => setError('네트워크 오류가 발생했어요'));
  }, [meetingId]);

  if (error) {
    return (
      <main className="flex items-center justify-center h-dvh">
        <p className="text-sm text-[var(--label-alternative)]">{error}</p>
      </main>
    );
  }

  if (!midpoint) {
    return (
      <main className="flex items-center justify-center h-dvh">
        <p className="text-sm text-[var(--label-alternative)]">
          중간지점 계산 중...
        </p>
      </main>
    );
  }

  const markers: Marker[] = [
    {
      lat: midpoint.latitude,
      lng: midpoint.longitude,
      label: '중간지점',
      id: 'midpoint',
    },
    ...places.map((p) => ({
      lat: p.lat,
      lng: p.lng,
      label: p.name,
      id: p.externalPlaceId,
    })),
  ];

  return (
    <main className="flex flex-col gap-4 p-4">
      <h1 className="text-lg font-semibold">최적 장소</h1>

      <KakaoMap
        center={{ lat: midpoint.latitude, lng: midpoint.longitude }}
        markers={markers}
        height="50vh"
      />

      {midpoint.excludedCount > 0 && (
        <p className="text-sm text-[var(--label-alternative)]">
          출발지 미입력 {midpoint.excludedCount}명은 계산에서 제외됐어요
        </p>
      )}

      {places.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold">추천 장소</h2>
          <ul className="flex flex-col gap-3">
            {places.map((p) => (
              <li key={p.externalPlaceId} className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{p.name}</span>
                <span className="text-xs text-[var(--label-alternative)]">
                  {p.categoryName} · 중간지점에서{' '}
                  {Math.round((p.distanceM / 1000) * 10) / 10}km
                </span>
                <span className="text-xs text-[var(--label-alternative)]">
                  {p.address}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold">멤버 거리</h2>
        <ul className="flex flex-col gap-2">
          {midpoint.memberDistances.map((m) => (
            <li key={m.memberId} className="flex justify-between text-sm">
              <span>{m.nickname}</span>
              <span className="text-[var(--label-alternative)]">
                {m.excluded
                  ? '출발지 미입력'
                  : `${Math.round(((m.distanceM ?? 0) / 1000) * 10) / 10}km`}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
