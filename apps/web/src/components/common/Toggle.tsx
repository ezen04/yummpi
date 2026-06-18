'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface ToggleProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export function Toggle({
  checked,
  onChange,
  disabled = false,
  label,
  className,
}: ToggleProps) {
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
      {/* 트랙 */}
      <span
        className={cn(
          'relative w-[51px] h-[31px] rounded-[var(--radius-full)] shrink-0 transition-[background] duration-200',
          checked ? 'bg-[var(--primary)]' : 'bg-[var(--fill-normal)]',
        )}
      >
        {/* 원 */}
        <span
          className="absolute top-0.5 w-[27px] h-[27px] rounded-full bg-[var(--static-white)] shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-[left] duration-200"
          style={{ left: checked ? 'calc(100% - 29px)' : 2 }}
        />
      </span>

      {label && (
        <span className="text-[15px] leading-[22px] font-normal font-[var(--font-sans)] text-[var(--label-normal)]">
          {label}
        </span>
      )}
    </label>
  );
}
