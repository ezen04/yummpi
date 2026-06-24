'use client';

import * as React from 'react';
import { Search } from '@yummpi/ui';
import { cn } from '@/lib/utils';

interface PlaceSearchInputProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

export function PlaceSearchInput({
  value,
  onChange,
  placeholder = '장소를 검색해주세요',
  autoFocus = true,
  className,
}: PlaceSearchInputProps) {
  return (
    <div
      className={cn(
        'relative h-[50px] rounded-[var(--radius-12)]',
        'border border-[var(--line-normal)] bg-[var(--bg-normal)]',
        'focus-within:border-[var(--primary)] transition-colors duration-150',
        className
      )}
    >
      <Search
        size={19}
        strokeWidth={1.5}
        color="var(--label-alternative)"
        className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={cn(
          'absolute inset-0 w-full h-full pl-[51px] pr-4',
          'bg-transparent border-none outline-none rounded-[var(--radius-12)]',
          'text-[15px] leading-[22px] font-[var(--font-sans)] text-[var(--label-normal)]',
          'placeholder:text-[var(--label-assistive)]'
        )}
      />
    </div>
  );
}
