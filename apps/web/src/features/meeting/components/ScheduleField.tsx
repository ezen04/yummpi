'use client';

import * as React from 'react';
import { DatePicker, WheelTimePicker } from '@yummpi/ui';
import { BottomSheet } from '@/components/common/BottomSheet';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils';

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'];

function formatDateChip(date: Date): string {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAY_KO[date.getDay()]})`;
}

function formatTimeChip(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function formatTrigger(date: Date): string {
  return `${formatDateChip(date)} ${formatTimeChip(date.getHours(), date.getMinutes())}`;
}

/** 5분 단위 반올림 — 초기값을 분 단위에 맞춰 보정. (VotingClosesAtSheet 패턴) */
function roundUpTo5Min(date: Date): { hour: number; minute: number } {
  const rounded = Math.ceil(date.getMinutes() / 5) * 5;
  if (rounded >= 60) {
    const next = new Date(date);
    next.setHours(date.getHours() + 1, 0, 0, 0);
    return { hour: next.getHours(), minute: 0 };
  }
  return { hour: date.getHours(), minute: rounded };
}

type ExpandedField = 'date' | 'time';

interface ScheduleFieldProps {
  label: string;
  required?: boolean;
  value: Date | null;
  onChange: (value: Date) => void;
  error?: boolean;
}

/**
 * 모임 일시 선택 — 트리거 버튼 + 바텀시트(달력 + 휠 시간).
 * ③ VotingClosesAtSheet와 동일한 @yummpi/ui DatePicker·WheelTimePicker 사용.
 * 과거 날짜는 선택 불가(minDate=오늘 0시).
 */
export function ScheduleField({
  label,
  required,
  value,
  onChange,
  error,
}: ScheduleFieldProps) {
  const [open, setOpen] = React.useState(false);
  const [draftDate, setDraftDate] = React.useState<Date | undefined>(
    value ?? undefined
  );
  const [draftTime, setDraftTime] = React.useState<{
    hour: number;
    minute: number;
  }>(() => {
    if (value) return { hour: value.getHours(), minute: value.getMinutes() };
    return roundUpTo5Min(new Date(Date.now() + 60 * 60 * 1000));
  });
  const [expanded, setExpanded] = React.useState<ExpandedField>('date');

  // 과거 날짜 차단 (오늘 포함 이후만 선택 가능).
  const minDate = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const openSheet = () => {
    setDraftDate(value ?? undefined);
    if (value) {
      setDraftTime({ hour: value.getHours(), minute: value.getMinutes() });
    }
    setExpanded('date');
    setOpen(true);
  };

  const confirm = () => {
    if (!draftDate) return;
    const combined = new Date(draftDate);
    combined.setHours(draftTime.hour, draftTime.minute, 0, 0);
    onChange(combined);
    setOpen(false);
  };

  const chipBase =
    'flex-1 h-9 px-3 rounded-[var(--radius-8)] text-[14px] leading-5 font-medium cursor-pointer transition-colors';
  const chipActive = 'bg-[var(--primary)] text-[var(--static-white)]';
  const chipInactive =
    'bg-[var(--fill-normal)] text-[var(--label-normal)] hover:bg-[var(--fill-strong)]';

  return (
    <div className="flex flex-col gap-[6px] w-full">
      <label className="text-[14px] leading-5 font-medium text-[var(--label-normal)]">
        {label}
        {required && <span className="text-[var(--primary)] ml-[2px]">•</span>}
      </label>

      <button
        type="button"
        onClick={openSheet}
        className="h-12 w-full rounded-[var(--radius-12)] px-4 text-left text-[16px] outline-none box-border cursor-pointer"
        style={{
          background: 'var(--bg-normal)',
          border: error
            ? '1px solid var(--status-negative-border)'
            : '1px solid var(--line-normal)',
          color: value ? 'var(--label-normal)' : 'var(--label-assistive)',
        }}
      >
        {value ? formatTrigger(value) : '일시를 선택해 주세요'}
      </button>

      {open && (
        <BottomSheet open onClose={() => setOpen(false)} variant="background">
          <div className="px-[17px] pb-2 flex flex-col gap-5">
            <div className="flex flex-col items-center gap-[5px]">
              <h3 className="text-[18px] leading-6 font-semibold text-[var(--label-normal)] m-0">
                모임 일시 선택
              </h3>
              <p className="text-[13px] leading-4 text-[var(--label-alternative)] m-0">
                모임 날짜와 시간을 정해주세요
              </p>
            </div>

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
                {draftDate ? formatDateChip(draftDate) : '날짜 선택'}
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
                {formatTimeChip(draftTime.hour, draftTime.minute)}
              </button>
            </div>

            <div className="min-h-[336px] flex flex-col justify-center">
              {expanded === 'date' ? (
                <div className="flex justify-center rounded-[var(--radius-12)] border border-[var(--line-normal)] bg-[var(--bg-normal)]">
                  <DatePicker
                    mode="single"
                    selected={draftDate}
                    onSelect={setDraftDate}
                    disabled={(date: Date) => date < minDate}
                  />
                </div>
              ) : (
                <WheelTimePicker
                  value={draftTime}
                  onChange={setDraftTime}
                  minuteStep={5}
                />
              )}
            </div>

            <Button
              variant="basic"
              size="lg"
              onClick={confirm}
              disabled={!draftDate}
              className="w-full"
            >
              확인
            </Button>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
