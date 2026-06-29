'use client';

import * as React from 'react';
import { Check, Star } from '@yummpi/ui';
import { cn } from '@/lib/utils';
import { PlaceThumbnail } from '@/features/place/components/recommendation/PlaceThumbnail';
import {
  mapKakaoCategoryToThumbnail,
  shortenKakaoCategory,
} from '@/features/place/utils/categoryMap';
import type { VoteCandidate } from '@/hooks/useVote';

interface VoteCandidateCardProps {
  candidate: VoteCandidate;
  isMyVote: boolean;
  isTopVote: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function VoteCandidateCard({
  candidate,
  isMyVote,
  isTopVote,
  onClick,
  disabled = false,
  className,
}: VoteCandidateCardProps) {
  const thumbnailCategory = mapKakaoCategoryToThumbnail(candidate.categoryName);
  const shortCategory = shortenKakaoCategory(candidate.categoryName);
  const distanceLabel =
    candidate.distanceM != null ? `${candidate.distanceM}m` : '';

  const subline = [shortCategory, distanceLabel].filter(Boolean).join(' · ');

  // 내가 이미 투표한 후보는 클릭 불가 (재투표 시 표수 깜빡임/롤백 방지).
  // 투표 변경은 다른 후보 클릭으로만 가능.
  const isClickable = !disabled && !!onClick && !isMyVote;

  // 투표율에 따른 progress bar — 카드 background를 linear-gradient로 채움.
  // 내 투표: 메인색 연하게(--primary-tint), 그 외: 연한 회색(--fill-normal)
  // 채움 색 다음에 --bg-normal로 명확한 경계선 형성.
  const fillColor = isMyVote ? 'var(--primary-tint)' : 'var(--fill-normal)';
  const safeRate = Math.max(0, Math.min(100, candidate.voteRate));
  const progressStyle: React.CSSProperties = {
    background: `linear-gradient(to right, ${fillColor} 0%, ${fillColor} ${safeRate}%, var(--bg-normal) ${safeRate}%, var(--bg-normal) 100%)`,
  };

  const baseClass = cn(
    'group w-full flex items-center gap-[15px] p-[15px] text-left',
    'rounded-[var(--radius-12)]',
    'border shadow-[var(--shadow-small)]',
    'transition-colors duration-150',
    isMyVote ? 'border-[var(--primary)]' : 'border-[var(--line-normal)]',
    isClickable && 'cursor-pointer hover:border-[var(--primary)]',
    className
  );

  const cardContent = (
    <>
      <PlaceThumbnail category={thumbnailCategory} size={46} />

      <div className="flex-1 min-w-0 flex flex-col gap-[3px]">
        <div className="flex items-center gap-1.5">
          <p className="text-[15px] leading-[22px] font-semibold font-[var(--font-sans)] text-[var(--label-normal)] m-0 truncate">
            {candidate.name}
          </p>
          {isTopVote && (
            <span className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[var(--secondary-tint)]">
              <Star size={11} strokeWidth={0} fill="var(--secondary-strong)" />
              <span className="text-[11px] leading-[14px] font-semibold font-[var(--font-sans)] text-[var(--secondary-strong)]">
                1위
              </span>
            </span>
          )}
        </div>

        {subline && (
          <p className="text-[12px] leading-4 font-normal font-[var(--font-sans)] text-[var(--label-alternative)] m-0 truncate">
            {subline}
          </p>
        )}
      </div>

      <div className="flex flex-col items-end shrink-0 min-w-[40px]">
        <span
          className={cn(
            'text-[15px] leading-[22px] font-semibold font-[var(--font-sans)]',
            isMyVote ? 'text-[var(--primary)]' : 'text-[var(--label-normal)]'
          )}
        >
          {candidate.voteCount}표
        </span>
        <span className="text-[12px] leading-4 font-normal font-[var(--font-sans)] text-[var(--label-assistive)]">
          {candidate.voteRate}%
        </span>
      </div>

      <span
        aria-label={isMyVote ? '내가 투표한 장소' : '선택하지 않은 장소'}
        className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center shrink-0',
          'transition-colors duration-150',
          isMyVote
            ? 'bg-[var(--primary)]'
            : 'border-[1.5px] border-[var(--line-normal)] bg-[var(--bg-normal)] group-hover:border-[var(--primary)]'
        )}
      >
        {isMyVote && (
          <Check size={14} strokeWidth={2.5} color="var(--static-white)" />
        )}
      </span>
    </>
  );

  if (isClickable) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={baseClass}
        style={progressStyle}
      >
        {cardContent}
      </button>
    );
  }

  return (
    <div className={baseClass} style={progressStyle}>
      {cardContent}
    </div>
  );
}
