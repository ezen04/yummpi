'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Chip } from '@/components/common/Chip';

export interface PlaceFilterChipItem {
  label: string;
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
        'flex gap-2 overflow-x-auto scrollbar-hide',
        '[-ms-overflow-style:none] [scrollbar-width:none]',
        '[&::-webkit-scrollbar]:hidden',
        className
      )}
    >
      {chips.map((chip, i) => (
        <Chip key={i} active={chip.active}>
          {chip.label}
        </Chip>
      ))}
    </div>
  );
}
