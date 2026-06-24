'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { PlaceThumbnail } from '@/features/place/components/recommendation/PlaceThumbnail';
import { mapKakaoCategoryToThumbnail } from '@/features/place/utils/categoryMap';

interface ConfirmedPlaceCardProps {
  name: string;
  categoryName: string | null;
  /** 부제 — 호출자가 가공 (예: "고기·삼겹살 · 8표 중 4표" / "고기·삼겹살 · 320m") */
  subline?: string;
  /** 강조 영역 라벨 ("최다 득표 1위" / "유일한 후보" / "현재 1위 장소" 등) */
  badgeLabel: string;
  /** 라벨 옆 아이콘 (Flame, Sparkles 등) */
  badgeIcon: React.ReactNode;
  className?: string;
}

/**
 * 확정된 장소 또는 확정 후보를 그라데이션 + 강조 라벨로 표시하는 카드.
 * - ConfirmPlaceSheet (시트 안 강조 카드)
 * - PlaceChangePage (현재 1위 장소 상단 박스)
 * 두 곳에서 재사용.
 */
export function ConfirmedPlaceCard({
  name,
  categoryName,
  subline,
  badgeLabel,
  badgeIcon,
  className,
}: ConfirmedPlaceCardProps) {
  const thumbnailCategory = mapKakaoCategoryToThumbnail(categoryName);

  return (
    <div
      className={cn(
        'rounded-[16px] border border-[var(--primary)]/20 p-[19px] flex flex-col gap-3',
        className
      )}
      style={{
        background:
          'linear-gradient(134deg, var(--primary-tint) 0%, var(--bg-normal) 100%)',
      }}
    >
      <div className="flex items-center gap-1.5">
        {badgeIcon}
        <span className="text-[13px] leading-[18px] font-semibold font-[var(--font-sans)] text-[var(--primary)]">
          {badgeLabel}
        </span>
      </div>

      <div className="flex items-center gap-[14px]">
        <PlaceThumbnail category={thumbnailCategory} size={60} />
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <p className="text-[17px] leading-6 font-semibold font-[var(--font-sans)] text-[var(--label-normal)] m-0 truncate">
            {name}
          </p>
          {subline && (
            <p className="text-[13px] leading-[18px] font-normal font-[var(--font-sans)] text-[var(--label-alternative)] m-0 truncate">
              {subline}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
