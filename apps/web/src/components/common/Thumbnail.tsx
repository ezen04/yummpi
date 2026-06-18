'use client';

import * as React from 'react';

type FoodCategory = 'korean' | 'japanese' | 'chinese' | 'meat' | 'cafe' | 'western';

interface ThumbnailProps {
  category: FoodCategory;
  size?: number;
}

const CATEGORY_CONFIG: Record<FoodCategory, { emoji: string; bg: string; label: string }> = {
  korean:   { emoji: '🍚', bg: '#FFF3E0', label: '한식' },
  japanese: { emoji: '🍱', bg: '#F3E5F5', label: '일식' },
  chinese:  { emoji: '🥢', bg: '#FCE4EC', label: '중식' },
  meat:     { emoji: '🥩', bg: '#FBE9E7', label: '고기' },
  cafe:     { emoji: '☕', bg: '#EFEBE9', label: '카페' },
  western:  { emoji: '🍝', bg: '#E8F5E9', label: '양식' },
};

export function Thumbnail({ category, size = 56 }: ThumbnailProps) {
  const { emoji, bg } = CATEGORY_CONFIG[category];

  return (
    <div
      aria-label={CATEGORY_CONFIG[category].label}
      style={{
        width: size,
        height: size,
        borderRadius: 'var(--radius-12)',
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: Math.round(size * 0.5),
        userSelect: 'none',
      }}
    >
      {emoji}
    </div>
  );
}
