'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface TieBreakCompletedNoticeProps {
  className?: string;
  /** 'tied': 동률 1위 다수 / 'noVotes': 0표 마감 (전원 동률) */
  variant?: 'tied' | 'noVotes';
}

export function TieBreakCompletedNotice({
  className,
  variant = 'tied',
}: TieBreakCompletedNoticeProps) {
  const body =
    variant === 'noVotes'
      ? '투표 결과가 없어요. 최종 장소를 직접 선택해주세요!'
      : '동률인 후보가 있습니다. 최종 장소를 확정해주세요!';

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-5 rounded-[var(--radius-10)] bg-[var(--secondary-tint)]',
        className
      )}
    >
      <div className="flex-1 flex flex-col gap-1">
        <p className="text-[13px] leading-[18px] font-bold font-[var(--font-sans)] text-[var(--secondary-strong)] m-0">
          투표가 마감되었어요!
        </p>
        <p className="text-[13px] leading-[18px] font-normal font-[var(--font-sans)] text-[var(--label-alternative)] m-0">
          {body}
        </p>
      </div>

      <Image
        src="/icons/confetti.svg"
        alt=""
        width={40}
        height={40}
        className="shrink-0"
        unoptimized
      />
    </div>
  );
}
