'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { KakaoMap } from '@/components/common/KakaoMap';

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

export default function OptimalPage() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const [data, setData] = useState<OptimalPointData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/v1/meetings/${meetingId}/places/optimal-point`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'COORDINATE' }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json.data);
        else setError(json.error?.message ?? '오류가 발생했어요');
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

  if (!data) {
    return (
      <main className="flex items-center justify-center h-dvh">
        <p className="text-sm text-[var(--label-alternative)]">
          중간지점 계산 중...
        </p>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-4 p-4">
      <h1 className="text-lg font-semibold">최적 장소</h1>

      <KakaoMap
        center={{ lat: data.latitude, lng: data.longitude }}
        markers={[
          {
            lat: data.latitude,
            lng: data.longitude,
            label: '중간지점',
            id: 'midpoint',
          },
        ]}
        height="50vh"
      />

      {data.excludedCount > 0 && (
        <p className="text-sm text-[var(--label-alternative)]">
          출발지 미입력 {data.excludedCount}명은 계산에서 제외됐어요
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {data.memberDistances.map((m) => (
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
    </main>
  );
}
