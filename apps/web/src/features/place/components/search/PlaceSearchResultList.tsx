'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { RecommendationItem } from '../../api/placeApi';
import { PlaceRecommendationCard } from '../recommendation/PlaceRecommendationCard';

interface PlaceSearchResultListProps {
  items: RecommendationItem[];
  mode: 'add' | 'confirm';
  /** 호스트가 선택한 투표 후보 (빨간 테두리 + primary ✓) */
  activeExternalIds: Set<string>;
  /** 풀에는 들어있으나 미선택 (일반 테두리 + 회색 ✓) */
  rejectedExternalIds: Set<string>;
  onSelect: (item: RecommendationItem) => void;
  isLoading?: boolean;
  isEmptyQuery?: boolean;
  className?: string;
}

export function PlaceSearchResultList({
  items,
  mode,
  activeExternalIds,
  rejectedExternalIds,
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
    // 목록 형식 스켈레톤 — 실제 카드(rounded-none + border-b)와 동일 레이아웃
    return (
      <div className={cn('flex flex-col', className)}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-[84px] border-b border-[var(--line-normal)] last:border-b-0 flex items-center gap-3 px-1 py-3"
          >
            <div className="w-16 h-16 rounded-[var(--radius-8)] bg-[var(--fill-normal)] animate-pulse shrink-0" />
            <div className="flex-1 min-w-0 flex flex-col gap-2">
              <div className="h-5 w-1/2 rounded bg-[var(--fill-normal)] animate-pulse" />
              <div className="h-4 w-3/4 rounded bg-[var(--fill-normal)] animate-pulse" />
              <div className="h-3 w-1/3 rounded bg-[var(--fill-normal)] animate-pulse" />
            </div>
            <div className="w-9 h-9 rounded-full bg-[var(--fill-normal)] animate-pulse shrink-0" />
          </div>
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

  // 검색 화면 한정: 카드 박스(테두리·둥근 모서리·그림자) 제거하고
  // 행 사이 얇은 구분선만 두는 목록 형식. PlaceRecommendationCard 컴포넌트
  // 자체는 건드리지 않고 className override로 처리.
  //
  // `divide-y` 대신 각 카드에 명시적 `border-b` + `last:border-b-0` 사용 —
  // 자식의 `border-0`이 부모 divide-y의 border-top까지 함께 무력화하는 문제 회피.
  return (
    <div className={cn('flex flex-col', className)}>
      {items.map((item) => {
        const isAddMode = mode === 'add';
        const candidateStatus: 'ACTIVE' | 'REJECTED' | null = isAddMode
          ? activeExternalIds.has(item.externalPlaceId)
            ? 'ACTIVE'
            : rejectedExternalIds.has(item.externalPlaceId)
              ? 'REJECTED'
              : null
          : null;
        return (
          <PlaceRecommendationCard
            key={item.externalPlaceId}
            name={item.name}
            categoryName={item.categoryName}
            distanceM={item.distanceM}
            address={item.address}
            reservable={!!item.phone}
            candidateStatus={candidateStatus}
            showAddAction={isAddMode}
            onAddCandidate={isAddMode ? () => onSelect(item) : undefined}
            onClick={!isAddMode ? () => onSelect(item) : undefined}
            className="rounded-none border-0 border-b border-b-[var(--line-normal)] hover:border-b-[var(--line-normal)] last:border-b-0 shadow-none"
          />
        );
      })}
    </div>
  );
}
