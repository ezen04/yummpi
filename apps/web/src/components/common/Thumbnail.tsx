'use client';

import * as React from 'react';

type FoodCategory = 'korean' | 'japanese' | 'chinese' | 'meat' | 'cafe' | 'western';

interface ThumbnailProps {
  category: FoodCategory;
  size?: number;
}

const CATEGORY_CONFIG: Record<FoodCategory, { bg: string; label: string; abbr: string }> = {
  korean:   { bg: '#FFF3E0', label: '한식', abbr: '한' },
  japanese: { bg: '#F3E5F5', label: '일식', abbr: '일' },
  chinese:  { bg: '#FCE4EC', label: '중식', abbr: '중' },
  meat:     { bg: '#FBE9E7', label: '고기', abbr: '고기' },
  cafe:     { bg: '#EFEBE9', label: '카페', abbr: '카페' },
  western:  { bg: '#E8F5E9', label: '양식', abbr: '양' },
};

export function Thumbnail({ category, size = 56 }: ThumbnailProps) {
  const { bg, label, abbr } = CATEGORY_CONFIG[category];

  return (
    <div
      aria-label={label}
      style={{
        width: size,
        height: size,
        borderRadius: 'var(--radius-12)',
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          font: `600 ${Math.round(size * 0.28)}px var(--font-sans)`,
          color: 'var(--label-alternative)',
          userSelect: 'none',
        }}
      >
        {abbr}
      </span>
    </div>
  );
}
