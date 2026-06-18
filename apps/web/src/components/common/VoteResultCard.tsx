'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { VoteResultBar } from './VoteResultBar';

interface VoteItem {
  label: string;
  votes: number;
}

interface VoteResultCardProps {
  title?: string;
  items: VoteItem[];
  className?: string;
}

export function VoteResultCard({
  title,
  items,
  className,
}: VoteResultCardProps) {
  const totalVotes = items.reduce((sum, item) => sum + item.votes, 0);
  const maxVotes = Math.max(...items.map((i) => i.votes));

  const withPercent = items
    .map((item) => ({
      ...item,
      percent:
        totalVotes === 0 ? 0 : Math.round((item.votes / totalVotes) * 100),
      isTop: item.votes === maxVotes && maxVotes > 0,
    }))
    .sort((a, b) => b.votes - a.votes);

  return (
    <div
      className={cn(
        'flex flex-col gap-[14px] bg-[var(--bg-elevated)] border border-[var(--line-normal)]',
        'rounded-[var(--radius-12)] px-5 py-4',
        className,
      )}
    >
      {title && (
        <p className="text-[15px] leading-[22px] font-semibold font-[var(--font-sans)] text-[var(--label-normal)] m-0">
          {title}
        </p>
      )}

      {withPercent.map((item, i) => (
        <VoteResultBar
          key={i}
          label={item.label}
          percent={item.percent}
          votes={item.votes}
          variant={item.isTop ? 'active' : 'inactive'}
        />
      ))}

      <p className="text-[12px] font-normal font-[var(--font-sans)] text-[var(--label-assistive)] m-0 text-right">
        총 {totalVotes}표
      </p>
    </div>
  );
}
