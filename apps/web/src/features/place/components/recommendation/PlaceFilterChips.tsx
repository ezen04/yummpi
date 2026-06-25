'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Chip } from '@/components/common/Chip';

export interface PlaceFilterChipItem {
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
}

interface PlaceFilterChipsProps {
  chips: PlaceFilterChipItem[];
  className?: string;
}

export function PlaceFilterChips({ chips, className }: PlaceFilterChipsProps) {
  return (
    <div
      className={cn(
        'flex flex-nowrap gap-2 overflow-x-auto',
        '[-ms-overflow-style:none] [scrollbar-width:none]',
        '[&::-webkit-scrollbar]:hidden',
        className
      )}
    >
      {chips.map((chip, i) => (
        <Chip key={i} active={chip.active} className="shrink-0">
          <span className="flex items-center gap-1 whitespace-nowrap">
            {chip.icon}
            {chip.label}
          </span>
        </Chip>
      ))}
    </div>
  );
}
