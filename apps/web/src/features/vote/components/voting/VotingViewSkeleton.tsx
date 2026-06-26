'use client';

import * as React from 'react';
import { Header } from '@/components/common/Header';

/**
 * VotingView 로딩 스켈레톤.
 * 실제 VotingView 레이아웃과 1:1 매칭 — Header + 제목 + Countdown +
 * 카드 리스트 + footer.
 */
export function VotingViewSkeleton({ onBack }: { onBack?: () => void }) {
  return (
    <div className="flex flex-col h-full bg-[var(--bg-normal)]">
      <Header title="장소 투표" onBack={onBack} />

      {/* 제목 영역 — "가고 싶은 장소를 골라주세요" + 보조 텍스트 */}
      <div className="shrink-0 px-5 pt-4 pb-2 flex flex-col gap-2">
        <div className="h-7 w-3/5 rounded bg-[var(--fill-normal)] animate-pulse" />
        <div className="h-[18px] w-2/5 rounded bg-[var(--fill-normal)] animate-pulse" />
      </div>

      {/* VotingCountdown 영역 */}
      <div className="shrink-0 px-5 pb-3">
        <div className="h-14 w-full rounded-[var(--radius-12)] bg-[var(--fill-normal)] animate-pulse" />
      </div>

      {/* 투표 카드 리스트 — 4개 */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-4">
        <div className="flex flex-col gap-[10px]">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[100px] rounded-[var(--radius-12)] bg-[var(--fill-normal)] animate-pulse"
            />
          ))}
        </div>
      </div>

      {/* VotingFooterActions */}
      <div className="shrink-0 border-t border-[var(--line-normal)] bg-[var(--bg-normal)] px-5 py-4 flex flex-col gap-3">
        <div className="h-4 w-3/5 rounded bg-[var(--fill-normal)] animate-pulse mx-auto" />
        <div className="h-12 w-full rounded-[var(--radius-12)] bg-[var(--fill-normal)] animate-pulse" />
      </div>
    </div>
  );
}
