'use client';

import * as React from 'react';
import { Header } from '@/components/common/Header';

/**
 * RecruitingView 로딩 스켈레톤.
 * 실제 RecruitingView 레이아웃과 1:1 매칭 — Header + chips + KakaoMap +
 * "추천 장소" 헤더 + 카운트 + 카드 리스트 + footer.
 *
 * useOptimalPoint / usePlaceRecommendations / usePlaceSuggestions 중 하나라도
 * isLoading 일 때 RecruitingView에서 이 컴포넌트 표시.
 */
export function RecruitingViewSkeleton({ onBack }: { onBack?: () => void }) {
  return (
    <div className="flex flex-col h-full bg-[var(--bg-normal)]">
      <Header title="장소 추천" onBack={onBack} />

      {/* chips 영역 — chip 3개 */}
      <div className="shrink-0 px-5 pt-4 pb-3 flex gap-2 overflow-hidden">
        <div className="h-7 w-20 rounded-full bg-[var(--fill-normal)] animate-pulse" />
        <div className="h-7 w-16 rounded-full bg-[var(--fill-normal)] animate-pulse" />
        <div className="h-7 w-20 rounded-full bg-[var(--fill-normal)] animate-pulse" />
      </div>

      {/* KakaoMap 영역 */}
      <div className="shrink-0 px-5 pb-4">
        <div className="w-full h-[148px] rounded-[var(--radius-12)] bg-[var(--fill-normal)] animate-pulse" />
      </div>

      {/* "추천 장소" 제목 + "후보 추가" 행 */}
      <div className="shrink-0 px-5 pb-2 flex items-center justify-between">
        <div className="h-6 w-20 rounded bg-[var(--fill-normal)] animate-pulse" />
        <div className="h-5 w-16 rounded bg-[var(--fill-normal)] animate-pulse" />
      </div>

      {/* 카운트 텍스트 */}
      <div className="shrink-0 px-5 pb-3">
        <div className="h-4 w-32 rounded bg-[var(--fill-normal)] animate-pulse" />
      </div>

      {/* 카드 리스트 — 4개 */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-4">
        <div className="flex flex-col gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[90px] rounded-[var(--radius-12)] bg-[var(--fill-normal)] animate-pulse"
            />
          ))}
        </div>
      </div>

      {/* RecruitingHostActions footer */}
      <div className="shrink-0 border-t border-[var(--line-normal)] bg-[var(--bg-normal)] px-5 py-4 flex flex-col gap-3">
        <div className="h-4 w-3/5 rounded bg-[var(--fill-normal)] animate-pulse mx-auto" />
        <div className="h-12 w-full rounded-[var(--radius-12)] bg-[var(--fill-normal)] animate-pulse" />
      </div>
    </div>
  );
}
