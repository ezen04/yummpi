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
    <div className={cn('flex flex-col gap-[6px]', className)}>
      <div className="flex justify-between items-center">
        <span
          className={cn(
            'text-[14px] leading-5 font-[var(--font-sans)]',
            isActive
              ? 'font-semibold text-[var(--label-normal)]'
              : 'font-normal text-[var(--label-alternative)]'
          )}
        >
          {label}
        </span>
        <span
          className={cn(
            'text-[13px] font-normal font-[var(--font-sans)]',
            isActive ? 'text-[var(--primary)]' : 'text-[var(--label-assistive)]'
          )}
        >
          {votes}표 ({percent}%)
        </span>
      </div>

      <div className="h-2 rounded bg-[var(--fill-normal)] overflow-hidden">
        <div
          className={cn(
            'h-full rounded transition-[width] duration-300 ease-in-out',
            isActive ? 'bg-[var(--primary)]' : 'bg-[var(--fill-strong)]'
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
