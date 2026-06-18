'use client';

import * as React from 'react';

interface TipboxProps {
  variant?: 'normal' | 'completed-vote' | 'completed-title';
  title?: string;
  children: React.ReactNode;
}

const VARIANT_STYLES: Record<
  NonNullable<TipboxProps['variant']>,
  { background: string; iconColor: string }
> = {
  'normal':           { background: 'var(--fill-normal)',         iconColor: 'var(--label-assistive)' },
  'completed-vote':   { background: 'rgba(233,75,53,0.06)',       iconColor: 'var(--primary)' },
  'completed-title':  { background: 'rgba(233,75,53,0.06)',       iconColor: 'var(--primary)' },
};

export function Tipbox({ variant = 'normal', title, children }: TipboxProps) {
  const { background, iconColor } = VARIANT_STYLES[variant];

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        padding: '12px 14px',
        borderRadius: 'var(--radius-12)',
        background,
        borderLeft: `3px solid var(--primary)`,
      }}
    >
      {/* 왼쪽 아이콘 — i */}
      <span
        style={{
          font: '600 13px var(--font-sans)',
          color: iconColor,
          flexShrink: 0,
          lineHeight: '20px',
        }}
      >
        i
      </span>

      <div style={{ flex: 1 }}>
        {title && (
          <p
            style={{
              font: '600 13px/18px var(--font-sans)',
              color: 'var(--label-normal)',
              margin: '0 0 2px',
            }}
          >
            {title}
          </p>
        )}
        <div
          style={{
            font: '400 13px/18px var(--font-sans)',
            color: 'var(--label-alternative)',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
