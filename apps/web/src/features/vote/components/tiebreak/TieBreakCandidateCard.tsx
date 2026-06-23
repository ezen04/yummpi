'use client';

import * as React from 'react';
import { Check } from '@yummpi/ui';
import { cn } from '@/lib/utils';
import { PlaceThumbnail } from '@/features/place/components/recommendation/PlaceThumbnail';
import {
  mapKakaoCategoryToThumbnail,
  shortenKakaoCategory,
} from '@/features/place/utils/categoryMap';
import type { VoteCandidate } from '@/hooks/useVote';

interface TieBreakCandidateCardProps {
  candidate: VoteCandidate;
  isSelected: boolean;
  onClick: () => void;
  className?: string;
}

export function TieBreakCandidateCard({
  candidate,
  isSelected,
  onClick,
  className,
}: TieBreakCandidateCardProps) {
  const thumbnailCategory = mapKakaoCategoryToThumbnail(candidate.categoryName);
  const shortCategory = shortenKakaoCategory(candidate.categoryName);
  const distanceLabel =
    candidate.distanceM != null ? `${candidate.distanceM}m` : '';

  const subline = [`${candidate.voteCount}표`, shortCategory, distanceLabel]
    .filter(Boolean)
    .join(' · ');

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group w-full flex items-center gap-3 p-[15px] text-left',
        'rounded-[var(--radius-12)] bg-[var(--bg-normal)]',
        'border shadow-[var(--shadow-small)]',
        'transition-colors duration-150',
        isSelected ? 'border-[var(--primary)]' : 'border-[var(--line-normal)]',
        'cursor-pointer hover:border-[var(--primary)]',
        className
      )}
    >
      <PlaceThumbnail category={thumbnailCategory} size={52} />

      <div className="flex-1 min-w-0 flex flex-col gap-[3px]">
        <p className="text-[15px] leading-[22px] font-semibold font-[var(--font-sans)] text-[var(--label-normal)] m-0 truncate">
          {candidate.name}
        </p>
        <p className="text-[12px] leading-4 font-normal font-[var(--font-sans)] text-[var(--label-alternative)] m-0 truncate">
          {subline}
        </p>
      </div>

      <span
        aria-label={isSelected ? '선택됨' : '선택하지 않음'}
        className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center shrink-0',
          'transition-colors duration-150',
          isSelected
            ? 'bg-[var(--primary)]'
            : 'border-[1.5px] border-[var(--line-normal)] bg-[var(--bg-normal)] group-hover:border-[var(--primary)]'
        )}
      >
        {isSelected && (
          <Check size={14} strokeWidth={2.5} color="var(--static-white)" />
        )}
      </span>
    </button>
  );
}
