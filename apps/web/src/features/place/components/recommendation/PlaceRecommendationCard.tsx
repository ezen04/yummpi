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
  /**
   * 후보 상태별 시각 분기.
   *  - 'ACTIVE'  : 빨간 테두리 + primary ✓ (호스트가 선택한 투표 후보)
   *  - 'REJECTED': 일반 테두리 + 회색 ✓ (풀에 들어 있으나 미선택 — 검색 화면 표시용)
   *  - null      : 일반 테두리 + (+) (어디에도 없음, 추가 가능)
   * 미지정 시 `isCandidate` boolean과 동일 동작 (하위 호환).
   */
  candidateStatus?: 'ACTIVE' | 'REJECTED' | null;
  /** @deprecated `candidateStatus`를 우선 사용. 둘 다 없으면 일반 상태. */
  isCandidate?: boolean;
  /** [+]/[✓] 아이콘 표시 여부 (mode=add용) */
  showAddAction?: boolean;
  /** 카드 [+] 클릭 핸들러 (mode=add용) */
  onAddCandidate?: () => void;
  /** 카드 전체 클릭 핸들러 (mode=confirm / select 등) */
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function PlaceRecommendationCard({
  name,
  categoryName,
  distanceM,
  address,
  reservable = false,
  candidateStatus,
  isCandidate = false,
  showAddAction = false,
  onAddCandidate,
  onClick,
  disabled = false,
  className,
}: PlaceRecommendationCardProps) {
  const thumbnailCategory = mapKakaoCategoryToThumbnail(categoryName);
  const shortCategory = shortenKakaoCategory(categoryName);
  const distanceLabel = distanceM != null ? `${distanceM}m` : '';

  // 하위 호환: candidateStatus 미지정 시 isCandidate boolean을 ACTIVE로 매핑
  const effectiveStatus: 'ACTIVE' | 'REJECTED' | null =
    candidateStatus !== undefined
      ? candidateStatus
      : isCandidate
        ? 'ACTIVE'
        : null;

  const cardOnClick = showAddAction ? onAddCandidate : onClick;
  // ACTIVE 카드도 호스트가 재클릭으로 강등할 수 있도록 클릭 허용.
  // 멤버는 부모가 onAddCandidate를 안 넘기므로 자동으로 클릭 비활성됨.
  const isClickable = !disabled && !!cardOnClick;

  const renderActionIndicator = () => {
    if (!showAddAction) return null;
    if (effectiveStatus === 'ACTIVE') {
      return (
        <span
          aria-label="이미 후보로 담김"
          className="w-9 h-9 rounded-full bg-[var(--primary)] flex items-center justify-center shrink-0"
        >
          <Check size={18} strokeWidth={2} color="var(--static-white)" />
        </span>
      );
    }
    if (effectiveStatus === 'REJECTED') {
      return (
        <span
          aria-label="이미 풀에 추가됨"
          className="w-9 h-9 rounded-full bg-[var(--label-alternative)] flex items-center justify-center shrink-0"
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
    // ACTIVE만 빨간 테두리. REJECTED와 none은 일반 테두리 — 검색 화면에서
    // 풀에 들어있는 카드와 호스트가 선택한 ACTIVE를 시각 구분
    effectiveStatus === 'ACTIVE'
      ? 'border-[var(--primary)]'
      : 'border-[var(--line-normal)]',
    isClickable && 'cursor-pointer hover:border-[var(--primary)]',
    className
  );

  if (isClickable) {
    return (
      <button type="button" onClick={cardOnClick} className={baseClass}>
        {cardContent}
      </button>
    );
  }

  return <div className={baseClass}>{cardContent}</div>;
}
