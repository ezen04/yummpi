'use client';

import * as React from 'react';
import { Clock, toast } from '@yummpi/ui';
import { cn } from '@/lib/utils';

const FIVE_MIN_MS = 5 * 60 * 1000;

interface VotingCountdownProps {
  votingClosesAt: string;
  votedMemberCount: number;
  totalVoters: number;
  className?: string;
}

function isSameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatClosesAt(closesAt: Date, now: Date): string {
  if (closesAt.getTime() <= now.getTime()) return '투표 마감됨';

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const hours = closesAt.getHours();
  const minutes = closesAt.getMinutes();
  const period = hours < 12 ? '오전' : '오후';
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  const minStr = minutes === 0 ? '' : ` ${minutes}분`;

  if (isSameDate(closesAt, now)) {
    return `오늘 ${period} ${h12}시${minStr} 마감`;
  }
  if (isSameDate(closesAt, tomorrow)) {
    return `내일 ${period} ${h12}시${minStr} 마감`;
  }
  return `${closesAt.getMonth() + 1}월 ${closesAt.getDate()}일 ${period} ${h12}시${minStr} 마감`;
}

export function VotingCountdown({
  votingClosesAt,
  votedMemberCount,
  totalVoters,
  className,
}: VotingCountdownProps) {
  const [now, setNow] = React.useState(() => new Date());
  // N-2: 마감 5분 전 1회 토스트 안내 가드. votingClosesAt이 변경되면 reset.
  const fiveMinWarnedRef = React.useRef(false);

  React.useEffect(() => {
    fiveMinWarnedRef.current = false;
  }, [votingClosesAt]);

  React.useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const closesAtDate = React.useMemo(
    () => new Date(votingClosesAt),
    [votingClosesAt]
  );

  // N-2: 매 분 갱신 시 남은 시간 비교. 5분 이하 + 0초 초과 + 미경고면 1회 토스트.
  React.useEffect(() => {
    const remainMs = closesAtDate.getTime() - now.getTime();
    if (remainMs > 0 && remainMs <= FIVE_MIN_MS && !fiveMinWarnedRef.current) {
      fiveMinWarnedRef.current = true;
      toast.warning('투표 마감 5분 전이에요!');
    }
  }, [now, closesAtDate]);

  const label = formatClosesAt(closesAtDate, now);

  return (
    <div
      className={cn(
        'flex items-center gap-1.5',
        'text-[13px] leading-[18px] font-medium font-[var(--font-sans)]',
        'text-[var(--label-alternative)]',
        className
      )}
    >
      <Clock
        size={15}
        strokeWidth={1.5}
        color="var(--label-alternative)"
        className="shrink-0"
      />
      <span>
        {label} · {votedMemberCount}명 / {totalVoters}명 투표
      </span>
    </div>
  );
}
