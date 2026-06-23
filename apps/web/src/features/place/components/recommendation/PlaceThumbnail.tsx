'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { FoodCategory } from '../../utils/categoryMap';

interface PlaceThumbnailProps {
  category: FoodCategory;
  size?: number;
  className?: string;
}

export function PlaceThumbnail({
  category,
  size = 64,
  className,
}: PlaceThumbnailProps) {
  return (
    <Image
      src={`/category/${category}.svg`}
      alt=""
      width={size}
      height={size}
      className={cn(
        'shrink-0 rounded-[var(--radius-12)] object-cover',
        className
      )}
      style={{ width: size, height: size }}
      unoptimized
    />
  );
}
