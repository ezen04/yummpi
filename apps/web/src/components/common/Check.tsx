'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface CheckProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function Check({
  checked,
  onChange,
  label,
  disabled = false,
  className,
}: CheckProps) {
  return (
    <label
      className={cn(
        'inline-flex items-center gap-[10px]',
        disabled ? 'cursor-default opacity-40' : 'cursor-pointer',
        className,
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="sr-only"
      />
      <span
        className={cn(
          'w-5 h-5 rounded flex items-center justify-center shrink-0',
          'transition-[background,border] duration-150',
          checked
            ? 'bg-[var(--primary)] border-none'
            : 'bg-[var(--bg-normal)] border-[1.5px] border-[var(--line-normal)]',
        )}
      >
        {checked && (
          <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
            <path
              d="M1 5L4.5 8.5L11 1.5"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>

      {label && (
        <span
          className={cn(
            'text-[15px] leading-[22px] font-normal font-[var(--font-sans)]',
            checked ? 'text-[var(--label-normal)]' : 'text-[var(--label-alternative)]',
          )}
        >
          {label}
        </span>
      )}
    </label>
  );
}
