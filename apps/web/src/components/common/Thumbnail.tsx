'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type FoodCategory =
  | 'korean'
  | 'japanese'
  | 'chinese'
  | 'meat'
  | 'cafe'
  | 'western';

interface ThumbnailProps {
  category: FoodCategory;
  size?: number;
  className?: string;
}

const CATEGORY_CONFIG: Record<
  FoodCategory,
  { bg: string; label: string; abbr: string }
> = {
  korean: { bg: '#FFF3E0', label: '한식', abbr: '한' },
  japanese: { bg: '#F3E5F5', label: '일식', abbr: '일' },
  chinese: { bg: '#FCE4EC', label: '중식', abbr: '중' },
  meat: { bg: '#FBE9E7', label: '고기', abbr: '고기' },
  cafe: { bg: '#EFEBE9', label: '카페', abbr: '카페' },
  western: { bg: '#E8F5E9', label: '양식', abbr: '양' },
};

export function Thumbnail({ category, size = 56, className }: ThumbnailProps) {
  const { bg, label, abbr } = CATEGORY_CONFIG[category];

  return (
    <div
      aria-label={label}
      className={cn(
        'flex items-center justify-center shrink-0 rounded-[var(--radius-12)]',
        className,
      )}
      style={{ width: size, height: size, background: bg }}
    >
      <span
        className="text-[var(--label-alternative)] select-none font-semibold font-[var(--font-sans)]"
        style={{ fontSize: Math.round(size * 0.28) }}
      >
        {abbr}
      </span>
    </div>
  );
}
