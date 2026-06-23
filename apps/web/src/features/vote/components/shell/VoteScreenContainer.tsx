'use client';

import * as React from 'react';

interface VoteScreenContainerProps {
  children: React.ReactNode;
}

export function VoteScreenContainer({ children }: VoteScreenContainerProps) {
  return (
    <div className="h-screen w-full bg-[var(--bg-alternative)] flex justify-center">
      {/*
       * transform-gpu: 자손 `position: fixed`의 containing block을 viewport에서
       * 이 컨테이너로 변경 (CSS spec) — BottomSheet/Overlay가 모바일 폭 안에만
       * 표시되도록 가두는 트릭.
       */}
      <div className="w-full max-w-[480px] h-full bg-[var(--bg-normal)] flex flex-col overflow-hidden transform-gpu">
        {children}
      </div>
    </div>
  );
}
