'use client';

import * as React from 'react';
import { Check, Plus } from '@yummpi/ui';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/common/Badge';
import {
  mapKakaoCategoryToThumbnail,
  shortenKakaoCategory,
} from '../../utils/categoryMap';
import { PlaceThumbnail } from './PlaceThumbnail';

interface PlaceRecommendationCardProps {
  name: string;
  categoryName: string | null;
  distanceM: number | null;
  address: string | null;
  reservable?: boolean;
  isCandidate?: boolean;
  showAddAction?: boolean;
  onAddCandidate?: () => void;
  disabled?: boolean;
  className?: string;
}

export function PlaceRecommendationCard({
  name,
  categoryName,
  distanceM,
  address,
  reservable = false,
  isCandidate = false,
  showAddAction = false,
  onAddCandidate,
  disabled = false,
  className,
}: PlaceRecommendationCardProps) {
  const thumbnailCategory = mapKakaoCategoryToThumbnail(categoryName);
  const shortCategory = shortenKakaoCategory(categoryName);
  const distanceLabel = distanceM != null ? `${distanceM}m` : '';

  const isClickable = showAddAction && !isCandidate && !disabled;

  const renderActionIndicator = () => {
    if (!showAddAction) return null;
    if (isCandidate) {
      return (
        <span
          aria-label="이미 후보로 담김"
          className="w-9 h-9 rounded-full bg-[var(--primary)] flex items-center justify-center shrink-0"
        >
          <Check size={18} strokeWidth={2} color="var(--static-white)" />
        </span>
      );
    }
    return (
      <span
        aria-hidden
        className={cn(
          'w-9 h-9 rounded-full border-[1.5px] border-[var(--line-normal)]',
          'flex items-center justify-center shrink-0 bg-[var(--bg-normal)]',
          'transition-colors duration-150',
          'group-hover:border-[var(--primary)] group-hover:text-[var(--primary)]'
        )}
      >
        <Plus size={18} strokeWidth={2} />
      </span>
    );
  };

  const cardContent = (
    <>
      <PlaceThumbnail category={thumbnailCategory} size={64} />

      <div className="flex-1 min-w-0 flex flex-col gap-[3px]">
        <div className="flex items-center gap-1.5">
          <p className="text-[15px] leading-[22px] font-semibold font-[var(--font-sans)] text-[var(--label-normal)] m-0 truncate">
            {name}
          </p>
          {reservable && (
            <Badge variant="reservable" className="shrink-0">
              예약가능
            </Badge>
          )}
        </div>

        {shortCategory && (
          <p className="text-[12px] leading-4 font-normal font-[var(--font-sans)] text-[var(--label-alternative)] m-0 truncate">
            {shortCategory}
          </p>
        )}

        {address && (
          <p className="text-[12px] leading-4 font-normal font-[var(--font-sans)] text-[var(--label-assistive)] m-0 truncate">
            {address}
          </p>
        )}

        {distanceLabel && (
          <span className="text-[12px] leading-4 font-medium font-[var(--font-sans)] text-[var(--label-alternative)]">
            {distanceLabel}
          </span>
        )}
      </div>

      {renderActionIndicator()}
    </>
  );

  const baseClass = cn(
    'group w-full flex items-center gap-3 p-[13px] text-left',
    'rounded-[var(--radius-12)] bg-[var(--bg-normal)]',
    'border shadow-[var(--shadow-small)]',
    'transition-colors duration-150',
    isCandidate ? 'border-[var(--primary)]' : 'border-[var(--line-normal)]',
    isClickable && 'cursor-pointer hover:border-[var(--primary)]',
    className
  );

  if (isClickable) {
    return (
      <button type="button" onClick={onAddCandidate} className={baseClass}>
        {cardContent}
      </button>
    );
  }

  return <div className={baseClass}>{cardContent}</div>;
}
