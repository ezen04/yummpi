'use client';

import * as React from 'react';

interface TipboxProps {
  variant?: 'normal' | 'completed-vote' | 'completed-title';
  title?: string;
  children: React.ReactNode;
}

export function Tipbox({ variant = 'normal', title, children }: TipboxProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 16px',
        borderRadius: 'var(--radius-10)',
        background: 'var(--secondary-tint)',
      }}
    >
      {/* Eye 아이콘 대체 — 간단한 SVG */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        style={{ flexShrink: 0 }}
      >
        <path
          d="M1.5 10C1.5 10 4.5 4 10 4C15.5 4 18.5 10 18.5 10C18.5 10 15.5 16 10 16C4.5 16 1.5 10 1.5 10Z"
          stroke="var(--secondary-strong)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx="10"
          cy="10"
          r="2.5"
          stroke="var(--secondary-strong)"
          strokeWidth="1.5"
        />
      </svg>

      <div style={{ flex: 1 }}>
        {title && variant === 'completed-title' && (
          <p
            style={{
              font: '600 13px/18px var(--font-sans)',
              color: 'var(--secondary-strong)',
              margin: '0 0 2px',
            }}
          >
            {title}
          </p>
        )}
        <p
          style={{
            font: '400 13px/18px var(--font-sans)',
            color: 'var(--secondary-strong)',
            margin: 0,
          }}
        >
          {children}
        </p>
      </div>
    </div>
  );
}
