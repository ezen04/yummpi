'use client';

import { useState } from 'react';
import { KakaoMap, type Marker } from '@/components/common/KakaoMap';
import { Header } from '@/components/common/Header';
import {
  MOCK_OPTIMAL_POINT,
  MOCK_RECOMMENDATIONS,
  type OptimalPointData,
} from './optimalMock';
import type { RecommendationItem } from '@/features/place/api/placeApi';

// ── 유틸 ──────────────────────────────────────────────────────

function formatKm(distanceM: number): string {
  if (distanceM < 1000) return `${distanceM}m`;
  return `${Math.round((distanceM / 1000) * 10) / 10}km`;
}

// ── DEV 컨트롤 패널 ───────────────────────────────────────────

type ScenarioKey = 'normal' | 'excluded' | 'no-places' | 'all-excluded';

const SCENARIOS: Record<
  ScenarioKey,
  { label: string; midpoint: OptimalPointData; places: RecommendationItem[] }
> = {
  normal: {
    label: '정상 (4명 · 추천 4곳)',
    midpoint: MOCK_OPTIMAL_POINT,
    places: MOCK_RECOMMENDATIONS,
  },
  excluded: {
    label: '제외 1명 · 추천 2곳',
    midpoint: MOCK_OPTIMAL_POINT,
    places: MOCK_RECOMMENDATIONS.slice(0, 2),
  },
  'no-places': {
    label: '추천 장소 없음',
    midpoint: MOCK_OPTIMAL_POINT,
    places: [],
  },
  'all-excluded': {
    label: '전원 출발지 미입력',
    midpoint: {
      ...MOCK_OPTIMAL_POINT,
      excludedCount: 4,
      memberDistances: MOCK_OPTIMAL_POINT.memberDistances.map((m) => ({
        ...m,
        distanceM: null,
        excluded: true,
      })),
    },
    places: [],
  },
};

// ── 메인 컴포넌트 ─────────────────────────────────────────────

export default function OptimalPreviewPage() {
  const [scenario, setScenario] = useState<ScenarioKey>('normal');

  const { midpoint, places } = SCENARIOS[scenario];

  const markers: Marker[] = [
    {
      lat: midpoint.latitude,
      lng: midpoint.longitude,
      label: '중간지점',
      id: 'midpoint',
    },
    ...places.map((p) => ({
      lat: Number(p.lat),
      lng: Number(p.lng),
      label: p.name,
      id: p.externalPlaceId,
    })),
  ];

  return (
    <div className="min-h-dvh bg-[var(--bg-alternative)]">
      {/* DEV 배너 */}
      <div className="bg-[var(--bg-inverse)] text-[var(--static-white)] px-4 py-2 flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[12px] font-semibold">
          DEV PREVIEW — 최적 장소 화면
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          {(Object.keys(SCENARIOS) as ScenarioKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setScenario(key)}
              className={`text-[11px] px-2 py-1 rounded transition-opacity ${
                scenario === key
                  ? 'bg-[var(--primary)] text-[var(--static-white)]'
                  : 'bg-[var(--fill-normal)] text-[var(--label-normal)] hover:opacity-80'
              }`}
            >
              {SCENARIOS[key].label}
            </button>
          ))}
        </div>
      </div>

      {/* 실제 화면 */}
      <Header title="최적 장소" onBack={() => {}} />

      <main className="flex flex-col gap-4 p-4">
        {/* 지도 */}
        <KakaoMap
          center={{ lat: midpoint.latitude, lng: midpoint.longitude }}
          markers={markers}
          height="40vh"
        />

        {/* 출발지 미입력 안내 */}
        {midpoint.excludedCount > 0 && (
          <p className="text-[13px] text-[var(--label-alternative)] bg-[var(--bg-normal)] rounded-[var(--radius-12)] px-4 py-3 border border-[var(--line-normal)]">
            출발지를 입력하지 않은 멤버{' '}
            <span className="font-semibold text-[var(--label-normal)]">
              {midpoint.excludedCount}명
            </span>
            은 중간지점 계산에서 제외됐어요.
          </p>
        )}

        {/* 추천 장소 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-[16px] font-semibold text-[var(--label-normal)]">
            추천 장소
          </h2>

          {places.length === 0 ? (
            <p className="text-[13px] text-[var(--label-alternative)] py-4 text-center">
              추천 장소가 없어요
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {places.map((p) => (
                <li
                  key={p.externalPlaceId}
                  className="bg-[var(--bg-normal)] rounded-[var(--radius-12)] px-4 py-3 flex flex-col gap-1 border border-[var(--line-normal)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-semibold text-[var(--label-normal)]">
                      {p.name}
                    </span>
                    <span className="text-[12px] text-[var(--primary)] font-medium">
                      {formatKm(p.distanceM)}
                    </span>
                  </div>
                  <span className="text-[12px] text-[var(--label-alternative)]">
                    {p.categoryName}
                  </span>
                  <span className="text-[12px] text-[var(--label-alternative)]">
                    {p.roadAddress ?? p.address}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 멤버 거리 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-[16px] font-semibold text-[var(--label-normal)]">
            멤버별 거리
          </h2>
          <ul className="bg-[var(--bg-normal)] rounded-[var(--radius-12)] border border-[var(--line-normal)] divide-y divide-[var(--line-alternative)]">
            {midpoint.memberDistances.map((m) => (
              <li
                key={m.memberId}
                className="flex items-center justify-between px-4 py-3"
              >
                <span className="text-[14px] text-[var(--label-normal)]">
                  {m.nickname}
                </span>
                <span
                  className={`text-[13px] font-medium ${
                    m.excluded
                      ? 'text-[var(--label-assistive)]'
                      : 'text-[var(--label-alternative)]'
                  }`}
                >
                  {m.excluded ? '출발지 미입력' : formatKm(m.distanceM ?? 0)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
