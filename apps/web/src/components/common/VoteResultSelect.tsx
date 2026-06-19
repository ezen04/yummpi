'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface VoteResultSelectProps {
  label: string;
  address?: string;
  category?: string;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function VoteResultSelect({
  label,
  address,
  category,
  selected = false,
  onClick,
  disabled = false,
  className,
}: VoteResultSelectProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full px-4 py-[14px] rounded-[var(--radius-12)] text-left flex items-center gap-3',
        'transition-[border,background] duration-150',
        selected
          ? 'border-[1.5px] border-[var(--primary)] bg-[var(--primary-tint)]'
          : 'border border-[var(--line-normal)] bg-[var(--bg-normal)]',
        disabled ? 'cursor-default opacity-50' : 'cursor-pointer',
        className,
      )}
    >
      {/* 선택 인디케이터 */}
      <span
        className={cn(
          'w-5 h-5 rounded-full flex items-center justify-center shrink-0',
          selected
            ? 'bg-[var(--primary)]'
            : 'bg-transparent border-[1.5px] border-[var(--line-normal)]',
        )}
      >
        {selected && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path
              d="M1 4L3.5 6.5L9 1"
              stroke="white"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>

      {/* 텍스트 */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-[15px] leading-[22px] font-[var(--font-sans)] m-0 truncate',
            selected ? 'font-semibold text-[var(--primary)]' : 'font-normal text-[var(--label-normal)]',
          )}
        >
          {label}
        </p>
        {(address || category) && (
          <p className="text-[12px] leading-4 font-normal font-[var(--font-sans)] text-[var(--label-assistive)] mt-[2px] mb-0 truncate">
            {[category, address].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>
    </button>
  );
}
