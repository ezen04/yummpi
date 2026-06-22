'use client';

import * as React from 'react';

interface VoteScreenContainerProps {
  children: React.ReactNode;
}

export function VoteScreenContainer({ children }: VoteScreenContainerProps) {
  return (
    <div className="h-screen w-full bg-[var(--bg-alternative)] flex justify-center">
      <div className="w-full max-w-[480px] h-full bg-[var(--bg-normal)] flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
