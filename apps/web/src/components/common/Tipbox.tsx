'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TipboxProps {
  variant?: 'normal' | 'completed-vote' | 'completed-title';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Tipbox({
  variant = 'normal',
  title,
  children,
  className,
}: TipboxProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-[10px]',
        'rounded-[var(--radius-10)] bg-[var(--secondary-tint)]',
        className,
      )}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0">
        <path
          d="M1.5 10C1.5 10 4.5 4 10 4C15.5 4 18.5 10 18.5 10C18.5 10 15.5 16 10 16C4.5 16 1.5 10 1.5 10Z"
          stroke="var(--secondary-strong)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="10" cy="10" r="2.5" stroke="var(--secondary-strong)" strokeWidth="1.5" />
      </svg>

      <div className="flex-1">
        {title && variant === 'completed-title' && (
          <p className="text-[13px] leading-[18px] font-semibold font-[var(--font-sans)] text-[var(--secondary-strong)] mb-[2px] mt-0">
            {title}
          </p>
        )}
        <p className="text-[13px] leading-[18px] font-normal font-[var(--font-sans)] text-[var(--secondary-strong)] m-0">
          {children}
        </p>
      </div>
    </div>
  );
}
