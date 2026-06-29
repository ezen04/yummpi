'use client';

import * as React from 'react';

interface VoteScreenContainerProps {
  children: React.ReactNode;
}

export function VoteScreenContainer({ children }: VoteScreenContainerProps) {
  // 모바일 폭·배경은 루트 layout이 담당.
  // h-screen: layout의 `min-h-screen` 안에서 자식이 늘어나면 body 스크롤이 생기므로
  // viewport 높이로 가둔다 → footer는 하단 고정, 리스트만 inner overflow-y-auto로 스크롤.
  // transform-gpu: 자손 `position: fixed`의 containing block을 viewport → 이 컨테이너로
  // 변경 (CSS spec) — BottomSheet/Overlay를 모바일 폭 안에 가두는 트릭.
  return (
    <div className="h-screen flex flex-col overflow-hidden transform-gpu">
      {children}
    </div>
  );
}
