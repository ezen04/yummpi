'use client';

import { useState } from 'react';
import { KakaoMap, type Marker } from '@/components/common/KakaoMap';
import { Header } from '@/components/common/Header';
import { Chip } from '@/components/common/Chip';
import { Button } from '@/components/common/Button';
import { MOCK_OPTIMAL_POINT, type OptimalPointData } from './optimalMock';

// ── DEV 시나리오 ──────────────────────────────────────────────

type ScenarioKey = 'normal' | 'partial' | 'none';

const SCENARIOS: Record<
  ScenarioKey,
  { label: string; data: OptimalPointData }
> = {
  normal: { label: '정상 (4역)', data: MOCK_OPTIMAL_POINT },
  partial: {
    label: '일부 미입력 (2역)',
    data: {
      ...MOCK_OPTIMAL_POINT,
      members: MOCK_OPTIMAL_POINT.members.map((m, i) =>
        i >= 2 ? { ...m, station: null, excluded: true } : m
      ),
    },
  },
  none: {
    label: '전원 미입력',
    data: {
      ...MOCK_OPTIMAL_POINT,
      members: MOCK_OPTIMAL_POINT.members.map((m) => ({
        ...m,
        station: null,
        excluded: true,
      })),
    },
  },
};

// ── 메인 컴포넌트 ─────────────────────────────────────────────

export default function OptimalPreviewPage() {
  const [scenario, setScenario] = useState<ScenarioKey>('normal');

  const data = SCENARIOS[scenario].data;
  const included = data.members.filter((m) => !m.excluded);
  const excludedCount = data.members.length - included.length;
  const canCompute = included.length > 0;

  const markers: Marker[] = canCompute
    ? [
        {
          lat: data.latitude,
          lng: data.longitude,
          label: data.placeLabel,
          id: 'midpoint',
        },
      ]
    : [];

  return (
    <div className="min-h-dvh bg-[var(--bg-normal)] flex flex-col">
      {/* DEV 배너 */}
      <div className="bg-[var(--bg-inverse)] text-[var(--static-white)] px-4 py-2 flex items-center justify-between gap-3 flex-wrap">
        <span className="text-[12px] font-semibold">
          DEV PREVIEW — 중간지점 화면
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

      {/* 상단바: 뒤로 + 닫기 */}
      <Header onBack={() => {}} onClose={() => {}} />

      <main className="flex-1 flex flex-col gap-6 px-5 pb-6 pt-2">
        {/* 타이틀 */}
        <div className="flex flex-col items-center gap-2 text-center mt-2">
          <h1 className="text-[22px] leading-[30px] font-bold text-[var(--label-normal)]">
            중간지점을 찾았어요!
          </h1>
          <p className="text-[14px] text-[var(--label-alternative)]">
            모든 출발역을 고려한 최적의 지점입니다
          </p>
        </div>

        {canCompute ? (
          <>
            {/* 지도 카드 + 중간지점 말풍선 */}
            <div className="relative rounded-[var(--radius-12)] overflow-hidden border border-[var(--line-normal)]">
              <KakaoMap
                center={{ lat: data.latitude, lng: data.longitude }}
                markers={markers}
                height="200px"
              />
              <div className="absolute top-4 right-4 bg-[var(--bg-normal)] rounded-[var(--radius-10)] px-3 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
                <p className="text-[11px] text-[var(--label-alternative)]">
                  중간지점
                </p>
                <p className="text-[14px] font-semibold text-[var(--label-normal)]">
                  {data.placeLabel}
                </p>
              </div>
            </div>

            {/* 참여한 역 */}
            <section className="flex flex-col gap-3">
              <h2 className="text-[14px] font-medium text-[var(--label-alternative)]">
                참여한 역
              </h2>
              <div className="flex flex-wrap gap-2">
                {included.map((m) => (
                  <Chip key={m.memberId}>{m.station}</Chip>
                ))}
              </div>
            </section>

            {/* 계산 기준 */}
            <section className="bg-[var(--bg-alternative)] rounded-[var(--radius-12)] px-4 py-4 flex flex-col gap-2">
              <h2 className="text-[14px] font-semibold text-[var(--label-normal)]">
                계산 기준
              </h2>
              <ul className="flex flex-col gap-1.5 text-[13px] text-[var(--label-alternative)]">
                <li className="flex gap-2">
                  <span aria-hidden>•</span>
                  <span>총 이동 거리 최소화</span>
                </li>
                <li className="flex gap-2">
                  <span aria-hidden>•</span>
                  <span>입력한 {included.length}개 역 기준</span>
                </li>
              </ul>
            </section>

            {excludedCount > 0 && (
              <p className="text-[12px] text-[var(--label-assistive)]">
                출발역을 입력하지 않은 {excludedCount}명은 계산에서 제외됐어요.
              </p>
            )}
          </>
        ) : (
          /* 전원 미입력 — 계산 불가 */
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="text-[15px] font-medium text-[var(--label-normal)]">
              중간지점을 계산할 수 없어요
            </p>
            <p className="text-[13px] text-[var(--label-alternative)]">
              출발역을 입력한 멤버가 없어요.
            </p>
          </div>
        )}
      </main>

      {/* 하단 고정 CTA */}
      <div className="sticky bottom-0 bg-[var(--bg-normal)] px-5 pt-3 pb-[max(env(safe-area-inset-bottom),16px)] border-t border-[var(--line-alternative)]">
        <Button
          variant="basic"
          size="lg"
          className="w-full"
          disabled={!canCompute}
          onClick={() =>
            console.log('[optimal-preview] 다음: 음식점 추천 보기 클릭')
          }
        >
          다음: 음식점 추천 보기
        </Button>
      </div>
    </div>
  );
}
