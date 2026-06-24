'use client';

import * as React from 'react';
import { Check } from '@yummpi/ui';
import { cn } from '@/lib/utils';
import { PlaceThumbnail } from '@/features/place/components/recommendation/PlaceThumbnail';
import {
  mapKakaoCategoryToThumbnail,
  shortenKakaoCategory,
} from '@/features/place/utils/categoryMap';

interface PlaceChangeCandidateCardProps {
  /** 카드 헤더 이름 */
  name: string;
  /** 카카오 raw 카테고리 */
  categoryName: string | null;
  /** 거리(m) — null이면 거리 정보 생략 */
  distanceM: number | null;
  /** 득표수 — null이면 "표" 정보 생략 (검색 결과용) */
  voteCount?: number | null;
  isSelected: boolean;
  onClick: () => void;
  className?: string;
}

/**
 * 장소 변경 화면의 라디오 선택 카드.
 * 사용처 1: 검색해서 선택한 장소 (voteCount 없음)
 * 사용처 2: 기존 후보 카드 (voteCount 있음)
 */
export function PlaceChangeCandidateCard({
  name,
  categoryName,
  distanceM,
  voteCount,
  isSelected,
  onClick,
  className,
}: PlaceChangeCandidateCardProps) {
  const thumbnailCategory = mapKakaoCategoryToThumbnail(categoryName);
  const shortCategory = shortenKakaoCategory(categoryName);
  const distanceLabel = distanceM != null ? `${distanceM}m` : '';

  const subline =
    voteCount != null
      ? [`${voteCount}표`, shortCategory, distanceLabel]
          .filter(Boolean)
          .join(' · ')
      : [shortCategory, distanceLabel].filter(Boolean).join(' · ');

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
          {name}
        </p>
        {subline && (
          <p className="text-[12px] leading-4 font-normal font-[var(--font-sans)] text-[var(--label-alternative)] m-0 truncate">
            {subline}
          </p>
        )}
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
