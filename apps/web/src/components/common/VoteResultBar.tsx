'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface VoteResultBarProps {
  label: string;
  percent: number;
  votes: number;
  variant?: 'active' | 'inactive';
  className?: string;
}

export function VoteResultBar({
  label,
  percent,
  votes,
  variant = 'inactive',
  className,
}: VoteResultBarProps) {
  const isActive = variant === 'active';

  return (
    <div
      className={cn(className)}
      style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            font: `${isActive ? '600' : '400'} 14px/20px var(--font-sans)`,
            color: isActive
              ? 'var(--label-normal)'
              : 'var(--label-alternative)',
          }}
        >
          {label}
        </span>
        <span
          style={{
            font: '400 13px var(--font-sans)',
            color: isActive ? 'var(--primary)' : 'var(--label-assistive)',
          }}
        >
          {votes}표 ({percent}%)
        </span>
      </div>

      {/* 퍼센트 바 */}
      <div
        style={{
          height: 8,
          borderRadius: 4,
          background: 'var(--fill-normal)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${percent}%`,
            borderRadius: 4,
            background: isActive ? 'var(--primary)' : 'var(--fill-strong)',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}
