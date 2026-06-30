'use client';

import * as React from 'react';
import { DatePicker, WheelTimePicker } from '@yummpi/ui';
import { BottomSheet } from '@/components/common/BottomSheet';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils';
import { useStartVoting } from '../../hooks/useStartVoting';
import { useVoteUiStore } from '../../stores/useVoteUiStore';

interface VotingClosesAtSheetProps {
  meetingId: string;
  meetingScheduledAt: string | null;
}

function combineDateTime(date: Date, hour: number, minute: number): Date {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d;
}

/**
 * 5분 단위 반올림 — 초기값을 분 단위에 맞춰 보정.
 * 예: 14:23 → 14:25, 14:28 → 14:30.
 */
function roundUpTo5Min(date: Date): { hour: number; minute: number } {
  const minute = date.getMinutes();
  const rounded = Math.ceil(minute / 5) * 5;
  if (rounded >= 60) {
    const next = new Date(date);
    next.setHours(date.getHours() + 1, 0, 0, 0);
    return { hour: next.getHours(), minute: 0 };
  }
  return { hour: date.getHours(), minute: rounded };
}

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'];

function formatDateChip(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const w = WEEKDAY_KO[date.getDay()];
  return `${y}년 ${m}월 ${d}일 (${w})`;
}

function formatTimeChip(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/** 모임 약속 시간을 안내용으로 표시 — "7월 1일 (수) 오후 6시 30분" */
function formatMeetingScheduledAt(date: Date): string {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const w = WEEKDAY_KO[date.getDay()];
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours < 12 ? '오전' : '오후';
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  const minStr = minutes === 0 ? '' : ` ${minutes}분`;
  return `${m}월 ${d}일 (${w}) ${period} ${h12}시${minStr}`;
}

type ExpandedField = 'date' | 'time';

export function VotingClosesAtSheet({
  meetingId,
  meetingScheduledAt,
}: VotingClosesAtSheetProps) {
  const close = useVoteUiStore((s) => s.closeVotingClosesAt);
  const { startVoting, isStarting, error } = useStartVoting(meetingId);

  // 초기 기본값 — 현재 시각 + 1시간을 5분 단위로 반올림.
  const [initialDefault] = React.useState(() => {
    const now = new Date(Date.now() + 60 * 60 * 1000);
    const { hour, minute } = roundUpTo5Min(now);
    return { date: now, hour, minute };
  });

  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    initialDefault.date
  );
  const [time, setTime] = React.useState<{ hour: number; minute: number }>({
    hour: initialDefault.hour,
    minute: initialDefault.minute,
  });

  // 어떤 chip이 활성화되어 펼쳐져 있는지 — 초기는 date.
  // 두 chip 중 하나만 활성. 활성 chip에 해당하는 picker만 표시.
  const [expanded, setExpanded] = React.useState<ExpandedField>('date');

  // BE 검증: now < votingClosesAt ≤ meeting.scheduledAt
  const minDate = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const maxDate = React.useMemo(
    () => (meetingScheduledAt ? new Date(meetingScheduledAt) : undefined),
    [meetingScheduledAt]
  );

  const handleSubmit = () => {
    if (!selectedDate) return;
    const combined = combineDateTime(selectedDate, time.hour, time.minute);
    startVoting(
      { votingClosesAt: combined.toISOString() },
      { onSuccess: () => close() }
    );
  };

  const errorMessage = error instanceof Error ? error.message : null;
  const isDisabled = !selectedDate || isStarting;

  const chipBase =
    'flex-1 h-9 px-3 rounded-[var(--radius-8)] text-[14px] leading-5 font-medium font-[var(--font-sans)] cursor-pointer transition-colors';
  const chipActive = 'bg-[var(--primary)] text-[var(--static-white)]';
  const chipInactive =
    'bg-[var(--fill-normal)] text-[var(--label-normal)] hover:bg-[var(--fill-strong)]';

  return (
    <BottomSheet open onClose={close} variant="background">
      <div className="px-[17px] pb-2 flex flex-col gap-5">
        {/* 헤더 */}
        <div className="flex flex-col items-center gap-[5px]">
          <h3 className="text-[18px] leading-6 font-semibold font-[var(--font-sans)] text-[var(--label-normal)] m-0">
            투표 마감 시간 설정
          </h3>
          <p className="text-[13px] leading-4 font-normal font-[var(--font-sans)] text-[var(--label-alternative)] m-0">
            투표가 끝나는 시간을 정해주세요
          </p>
          {meetingScheduledAt && (
            // 모임 약속 시간 안내 — 호스트가 마감 시각 상한을 사전에 알 수 있게.
            // BE 검증("모임 약속 시간 이전으로 설정해주세요") 실패 전에 가이드 노출.
            <p className="text-[12px] leading-4 font-normal font-[var(--font-sans)] text-[var(--label-assistive)] m-0 mt-1">
              모임 시간:{' '}
              {formatMeetingScheduledAt(new Date(meetingScheduledAt))} 이전
            </p>
          )}
        </div>

        {/* 날짜·시간 chip 행 — 클릭한 쪽이 활성화되며 아래에 해당 picker 표시 */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded('date')}
            className={cn(
              chipBase,
              expanded === 'date' ? chipActive : chipInactive
            )}
            aria-pressed={expanded === 'date'}
          >
            {selectedDate ? formatDateChip(selectedDate) : '날짜 선택'}
          </button>
          <button
            type="button"
            onClick={() => setExpanded('time')}
            className={cn(
              chipBase,
              'flex-none w-20 text-center',
              expanded === 'time' ? chipActive : chipInactive
            )}
            aria-pressed={expanded === 'time'}
          >
            {formatTimeChip(time.hour, time.minute)}
          </button>
        </div>

        {/* 활성 chip에 따른 picker — 영역 높이 고정(min-h)으로 chip 전환 시 BottomSheet 높이 유지 */}
        <div className="min-h-[336px] flex flex-col justify-center">
          {expanded === 'date' ? (
            <div className="flex justify-center rounded-[var(--radius-12)] border border-[var(--line-normal)] bg-[var(--bg-normal)]">
              <DatePicker
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => {
                  if (date < minDate) return true;
                  if (maxDate && date > maxDate) return true;
                  return false;
                }}
              />
            </div>
          ) : (
            <WheelTimePicker value={time} onChange={setTime} minuteStep={5} />
          )}
        </div>

        {/* 푸터 */}
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
