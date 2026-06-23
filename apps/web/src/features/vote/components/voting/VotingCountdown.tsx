'use client';

import * as React from 'react';
import { Clock } from '@yummpi/ui';
import { cn } from '@/lib/utils';

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

  React.useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const closesAtDate = React.useMemo(
    () => new Date(votingClosesAt),
    [votingClosesAt]
  );
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
