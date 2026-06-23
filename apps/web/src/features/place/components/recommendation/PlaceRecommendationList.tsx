'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { PlaceRecommendationCard } from './PlaceRecommendationCard';
import type { RecommendationItem } from '../../api/placeApi';

interface PlaceRecommendationListProps {
  items: RecommendationItem[];
  candidateExternalIds: Set<string>;
  showAddAction: boolean;
  onAddCandidate: (item: RecommendationItem) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function PlaceRecommendationList({
  items,
  candidateExternalIds,
  showAddAction,
  onAddCandidate,
  isLoading = false,
  emptyMessage = '조건에 맞는 추천 장소가 없어요.',
  className,
}: PlaceRecommendationListProps) {
  if (isLoading) {
    return (
      <div className={cn('flex flex-col gap-3', className)}>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-[111px] rounded-[var(--radius-12)] bg-[var(--fill-normal)] animate-pulse"
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
          'text-[var(--label-alternative)] text-center py-8 m-0',
          className
        )}
      >
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {items.map((item) => {
        const isCandidate = candidateExternalIds.has(item.externalPlaceId);
        return (
          <PlaceRecommendationCard
            key={item.externalPlaceId}
            name={item.name}
            categoryName={item.categoryName}
            distanceM={item.distanceM}
            address={item.address}
            reservable={!!item.phone}
            isCandidate={isCandidate}
            showAddAction={showAddAction}
            onAddCandidate={() => onAddCandidate(item)}
          />
        );
      })}
    </div>
  );
}
