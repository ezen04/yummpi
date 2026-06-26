'use client';

import * as React from 'react';
import { Header } from '@/components/common/Header';

/**
 * PlaceChangePage 로딩 스켈레톤.
 * 실제 레이아웃 매칭 — Header + 현재 1위 박스(강조) + 검색 진입 + 후보 라디오 + footer.
 */
export function PlaceChangePageSkeleton({ onBack }: { onBack?: () => void }) {
  return (
    <div className="h-screen w-full bg-[var(--bg-alternative)] flex justify-center">
      <div className="w-full max-w-[480px] h-full bg-[var(--bg-normal)] flex flex-col overflow-hidden transform-gpu">
        <Header title="장소 변경" onBack={onBack} />

        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 flex flex-col gap-6">
          {/* 1. 현재 1위 박스 (ConfirmedPlaceCard 형식, 강조) */}
          <div className="flex flex-col gap-3">
            <div className="h-5 w-24 rounded bg-[var(--fill-normal)] animate-pulse" />
            <div className="h-[100px] rounded-[var(--radius-12)] bg-[var(--fill-normal)] animate-pulse" />
          </div>

          {/* 2. 검색 진입 버튼 */}
          <div className="flex flex-col gap-3">
            <div className="h-5 w-32 rounded bg-[var(--fill-normal)] animate-pulse" />
            <div className="h-[50px] rounded-[var(--radius-12)] bg-[var(--fill-normal)] animate-pulse" />
          </div>

          {/* 3. 후보 라디오 리스트 — 3개 */}
          <div className="flex flex-col gap-3">
            <div className="h-5 w-40 rounded bg-[var(--fill-normal)] animate-pulse" />
            <div className="flex flex-col gap-[10px]">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-[82px] rounded-[var(--radius-12)] bg-[var(--fill-normal)] animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>

        {/* footer */}
        <div className="shrink-0 border-t border-[var(--line-normal)] bg-[var(--bg-normal)] px-5 py-4 flex flex-col gap-3">
          <div className="h-4 w-3/5 rounded bg-[var(--fill-normal)] animate-pulse mx-auto" />
          <div className="h-12 w-full rounded-[var(--radius-12)] bg-[var(--fill-normal)] animate-pulse" />
        </div>
      </div>
    </div>
  );
}
