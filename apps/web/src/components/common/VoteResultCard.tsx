'use client';

import * as React from 'react';
import { VoteResultBar } from './VoteResultBar';

interface VoteItem {
  label: string;
  votes: number;
}

interface VoteResultCardProps {
  title?: string;
  items: VoteItem[];
}

export function VoteResultCard({ title, items }: VoteResultCardProps) {
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
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--line-normal)',
        borderRadius: 'var(--radius-12)',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      {title && (
        <p
          style={{
            font: '600 15px/22px var(--font-sans)',
            color: 'var(--label-normal)',
            margin: 0,
          }}
        >
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

      <p
        style={{
          font: '400 12px var(--font-sans)',
          color: 'var(--label-assistive)',
          margin: 0,
          textAlign: 'right',
        }}
      >
        총 {totalVotes}표
      </p>
    </div>
  );
}
