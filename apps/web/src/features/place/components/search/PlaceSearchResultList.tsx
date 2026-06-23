'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { RecommendationItem } from '../../api/placeApi';
import { PlaceRecommendationCard } from '../recommendation/PlaceRecommendationCard';

interface PlaceSearchResultListProps {
  items: RecommendationItem[];
  mode: 'add' | 'confirm';
  candidateExternalIds: Set<string>;
  onSelect: (item: RecommendationItem) => void;
  isLoading?: boolean;
  isEmptyQuery?: boolean;
  className?: string;
}

export function PlaceSearchResultList({
  items,
  mode,
  candidateExternalIds,
  onSelect,
  isLoading = false,
  isEmptyQuery = false,
  className,
}: PlaceSearchResultListProps) {
  if (isEmptyQuery) {
    return (
      <p
        className={cn(
          'text-[13px] leading-[18px] font-normal font-[var(--font-sans)]',
          'text-[var(--label-alternative)] text-center py-12 m-0',
          className
        )}
      >
        장소를 검색해보세요
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className={cn('flex flex-col gap-3', className)}>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-[96px] rounded-[var(--radius-12)] bg-[var(--fill-normal)] animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p
        className={cn(
          'text-[13px] leading-[18px] font-normal font-[var(--font-sans)]',
          'text-[var(--label-alternative)] text-center py-12 m-0',
          className
        )}
      >
        검색 결과가 없어요
      </p>
    );
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {items.map((item) => {
        const isCandidate = candidateExternalIds.has(item.externalPlaceId);
        const isAddMode = mode === 'add';
        return (
          <PlaceRecommendationCard
            key={item.externalPlaceId}
            name={item.name}
            categoryName={item.categoryName}
            distanceM={item.distanceM}
            address={item.address}
            reservable={!!item.phone}
            isCandidate={isAddMode && isCandidate}
            showAddAction={isAddMode}
            onAddCandidate={isAddMode ? () => onSelect(item) : undefined}
            onClick={!isAddMode ? () => onSelect(item) : undefined}
          />
        );
      })}
    </div>
  );
}
