'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SelectboxItemProps {
  position?: 'top' | 'mid' | 'end' | 'solo';
  selected?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

const RADIUS_CLASSES: Record<NonNullable<SelectboxItemProps['position']>, string> = {
  top: 'rounded-tl-[var(--radius-12)] rounded-tr-[var(--radius-12)] rounded-bl-none rounded-br-none',
  mid: 'rounded-none',
  end: 'rounded-tl-none rounded-tr-none rounded-bl-[var(--radius-12)] rounded-br-[var(--radius-12)]',
  solo: 'rounded-[var(--radius-12)]',
};

export function SelectboxItem({
  position = 'mid',
  selected = false,
  onClick,
  children,
  className,
}: SelectboxItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full h-12 px-4 border-none cursor-pointer text-left flex items-center',
        'text-[15px] font-[var(--font-sans)] transition-[background] duration-100',
        selected
          ? 'bg-[var(--primary-tint)] text-[var(--primary)] font-semibold'
          : 'bg-[var(--bg-normal)] text-[var(--label-normal)] font-normal hover:bg-[var(--fill-normal)]',
        RADIUS_CLASSES[position],
        className,
      )}
    >
      {children}
    </button>
  );
}

interface SelectboxProps {
  options: { value: string; label: string }[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function Selectbox({
  options,
  value,
  onChange,
  className,
}: SelectboxProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-12)] border border-[var(--line-normal)] overflow-hidden',
        className,
      )}
    >
      {options.map((opt, i) => {
        const position =
          options.length === 1
            ? 'solo'
            : i === 0
              ? 'top'
              : i === options.length - 1
                ? 'end'
                : 'mid';

        return (
          <React.Fragment key={opt.value}>
            {i > 0 && (
              <div className="h-px bg-[var(--line-normal)] mx-4" />
            )}
            <SelectboxItem
              position={position}
              selected={value === opt.value}
              onClick={() => onChange?.(opt.value)}
            >
              {opt.label}
            </SelectboxItem>
          </React.Fragment>
        );
      })}
    </div>
  );
}
