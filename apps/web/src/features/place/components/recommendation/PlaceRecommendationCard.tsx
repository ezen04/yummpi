'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Thumbnail } from '@/components/common/Thumbnail';
import {
  mapKakaoCategoryToThumbnail,
  shortenKakaoCategory,
} from '../../utils/categoryMap';

interface PlaceRecommendationCardProps {
  name: string;
  categoryName: string | null;
  distanceM: number | null;
  address: string | null;
  isCandidate?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function PlaceRecommendationCard({
  name,
  categoryName,
  distanceM,
  address,
  isCandidate = false,
  onClick,
  disabled = false,
  className,
}: PlaceRecommendationCardProps) {
  const thumbnailCategory = mapKakaoCategoryToThumbnail(categoryName);
  const shortCategory = shortenKakaoCategory(categoryName);
  const distanceLabel = distanceM != null ? `${distanceM}m` : '';
  const subline = [shortCategory, distanceLabel].filter(Boolean).join(' · ');

  const inactive = disabled || isCandidate;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={inactive}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 text-left',
        'rounded-[var(--radius-12)] bg-[var(--bg-normal)]',
        'border border-[var(--line-normal)]',
        'transition-[background] duration-150',
        inactive ? 'cursor-default opacity-50' : 'cursor-pointer',
        className
      )}
    >
      <Thumbnail category={thumbnailCategory} size={56} />

      <div className="flex-1 min-w-0">
        <p className="text-[15px] leading-[22px] font-semibold font-[var(--font-sans)] text-[var(--label-normal)] m-0 truncate">
          {name}
        </p>
        {subline && (
          <p className="text-[12px] leading-4 font-normal font-[var(--font-sans)] text-[var(--label-alternative)] mt-[2px] mb-0 truncate">
            {subline}
          </p>
        )}
        {address && (
          <p className="text-[12px] leading-4 font-normal font-[var(--font-sans)] text-[var(--label-assistive)] mt-[2px] mb-0 truncate">
            {address}
          </p>
        )}
      </div>

      {isCandidate && (
        <span className="text-[12px] font-medium font-[var(--font-sans)] text-[var(--primary)] shrink-0">
          담김
        </span>
      )}
    </button>
  );
}
