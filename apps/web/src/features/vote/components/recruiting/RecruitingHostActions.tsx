'use client';

import * as React from 'react';
import { Check } from '@yummpi/ui';
import { cn } from '@/lib/utils';
import { Button } from '@/components/common/Button';

interface RecruitingHostActionsProps {
  candidateCount: number;
  viewerRole: 'HOST' | 'MEMBER';
  onStartVoting: () => void;
  onConfirmSingle: () => void;
  className?: string;
}

export function RecruitingHostActions({
  candidateCount,
  viewerRole,
  onStartVoting,
  onConfirmSingle,
  className,
}: RecruitingHostActionsProps) {
  const isHost = viewerRole === 'HOST';
  const isZero = candidateCount === 0;
  const isSingle = candidateCount === 1;

  const hostNotice = isZero
    ? '후보를 1곳 이상 담아주세요'
    : isSingle
      ? '후보 1곳 담음 · 투표 없이 바로 확정할 수 있어요'
      : `후보 ${candidateCount}곳 담음 · 주최자만 투표를 시작할 수 있어요`;

  const memberNotice = isZero
    ? '주최자가 후보를 모으고 있어요'
    : isSingle
      ? '주최자가 곧 장소를 확정해요'
      : '주최자가 곧 투표를 시작해요';

  const noticeText = isHost ? hostNotice : memberNotice;

  const ctaLabel = isHost
    ? isSingle
      ? '이 장소로 확정'
      : '투표 시작하기'
    : '투표 시작을 기다리는 중';

  const isDisabled = !isHost || isZero;

  const handleClick = () => {
    if (!isHost || isZero) return;
    if (isSingle) {
      onConfirmSingle();
    } else {
      onStartVoting();
    }
  };

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
        onClick={handleClick}
        disabled={isDisabled}
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
