'use client';

import * as React from 'react';
import { Calendar } from '@yummpi/ui';
import { BottomSheet } from '@/components/common/BottomSheet';
import { Button } from '@/components/common/Button';
import { useStartVoting } from '../../hooks/useStartVoting';
import { useVoteUiStore } from '../../stores/useVoteUiStore';

interface VotingClosesAtSheetProps {
  meetingId: string;
  meetingScheduledAt: string | null;
}

/**
 * `<input type="datetime-local">`이 요구하는 로컬 ISO 포맷 변환 (YYYY-MM-DDTHH:mm).
 * 사용자 기기 타임존 기준 값을 유지한 채 input value로 사용.
 */
function toLocalDateTimeInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

export function VotingClosesAtSheet({
  meetingId,
  meetingScheduledAt,
}: VotingClosesAtSheetProps) {
  const close = useVoteUiStore((s) => s.closeVotingClosesAt);

  const { startVoting, isStarting, error } = useStartVoting(meetingId);

  const [value, setValue] = React.useState<string>('');

  const [minDateTime] = React.useState(() =>
    toLocalDateTimeInputValue(new Date(Date.now() + 60_000))
  );

  const [maxDateTime] = React.useState<string | undefined>(() =>
    meetingScheduledAt
      ? toLocalDateTimeInputValue(new Date(meetingScheduledAt))
      : undefined
  );

  const handleSubmit = () => {
    if (!value) return;
    const isoString = new Date(value).toISOString();
    startVoting(
      { votingClosesAt: isoString },
      {
        onSuccess: () => close(),
      }
    );
  };

  const errorMessage = error instanceof Error ? error.message : null;
  const isDisabled = !value || isStarting;

  return (
    <BottomSheet open onClose={close} variant="background">
      <div className="px-[17px] pb-2 flex flex-col gap-[26px]">
        {/* 헤더 — 가운데 정렬 */}
        <div className="flex flex-col items-center gap-[5px]">
          <h3 className="text-[18px] leading-6 font-semibold font-[var(--font-sans)] text-[var(--label-normal)] m-0">
            투표 마감 시간 설정
          </h3>
          <p className="text-[13px] leading-4 font-normal font-[var(--font-sans)] text-[var(--label-alternative)] m-0">
            투표가 끝나는 시간을 정해주세요
          </p>
        </div>

        {/* 날짜 카드 (높이 50px) — input이 전체 영역 차지 → 빈 공간 클릭도 picker 트리거 */}
        <div className="relative h-[50px] rounded-[var(--radius-12)] border border-[var(--line-normal)] bg-[var(--bg-normal)]">
          <Calendar
            size={19}
            strokeWidth={1.5}
            color="var(--label-normal)"
            className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
          />
          <input
            type="datetime-local"
            value={value}
            min={minDateTime}
            max={maxDateTime}
            onChange={(e) => setValue(e.target.value)}
            aria-label="투표 마감 시각 선택"
            className="absolute inset-0 w-full h-full pl-[51px] pr-4 bg-transparent border-none outline-none rounded-[var(--radius-12)] text-[15px] leading-[22px] font-[var(--font-sans)] text-[var(--label-normal)] cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
          />
        </div>

        {/* 푸터 — 안내문 + 버튼 (8px gap) */}
        <div className="flex flex-col gap-2">
          <p className="text-[12px] leading-4 font-normal font-[var(--font-sans)] text-[var(--label-alternative)] m-0 text-center">
            마감 후 주최자가 최종 장소를 확정해요
          </p>

          {errorMessage && (
            <p className="text-[12px] leading-4 font-normal font-[var(--font-sans)] text-[var(--status-negative)] m-0 text-center">
              {errorMessage}
            </p>
          )}

          <Button
            variant="basic"
            size="lg"
            onClick={handleSubmit}
            disabled={isDisabled}
            className="w-full"
          >
            {isStarting ? '진행 중...' : '투표 시작하기'}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
