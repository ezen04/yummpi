'use client';

import * as React from 'react';
import { Check } from '@yummpi/ui';
import { cn } from '@/lib/utils';
import { Button } from '@/components/common/Button';

interface VotingFooterActionsProps {
  viewerRole: 'HOST' | 'MEMBER';
  onConfirm: () => void;
  className?: string;
}

export function VotingFooterActions({
  viewerRole,
  onConfirm,
  className,
}: VotingFooterActionsProps) {
  const isHost = viewerRole === 'HOST';

  const noticeText = isHost
    ? '주최자는 투표를 마감하고 장소를 확정할 수 있어요'
    : '투표 마감 후 주최자가 최종 확정해요';

  const ctaLabel = isHost ? '투표 마감하고 확정하기' : '확정을 기다리는 중';

  return (
    <div
      className={cn(
        'shrink-0 border-t border-[var(--line-normal)] bg-[var(--bg-normal)]',
        'px-5 py-4 flex flex-col gap-3',
        className
      )}
    >
      <p className="text-[12px] leading-4 font-normal font-[var(--font-sans)] text-[var(--label-alternative)] m-0 text-center">
        {noticeText}
      </p>

      <Button
        variant="basic"
        size="lg"
        onClick={isHost ? onConfirm : undefined}
        disabled={!isHost}
        leftIcon={
          <Check size={18} strokeWidth={2} color="var(--static-white)" />
        }
        className="w-full"
      >
        {ctaLabel}
      </Button>
    </div>
  );
}
