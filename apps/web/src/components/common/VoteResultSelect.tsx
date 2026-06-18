'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface VoteResultSelectProps {
  label: string;
  address?: string;
  category?: string;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function VoteResultSelect({
  label,
  address,
  category,
  selected = false,
  onClick,
  disabled = false,
  className,
}: VoteResultSelectProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(className)}
      style={{
        width: '100%',
        padding: '14px 16px',
        borderRadius: 'var(--radius-12)',
        border: selected
          ? '1.5px solid var(--primary)'
          : '1px solid var(--line-normal)',
        background: selected ? 'rgba(233,75,53,0.04)' : 'var(--bg-normal)',
        cursor: disabled ? 'default' : 'pointer',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        opacity: disabled ? 0.5 : 1,
        transition: 'border 0.15s, background 0.15s',
      }}
    >
      {/* 선택 인디케이터 */}
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          border: selected ? 'none' : '1.5px solid var(--line-normal)',
          background: selected ? 'var(--primary)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {selected && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path
              d="M1 4L3.5 6.5L9 1"
              stroke="white"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>

      {/* 텍스트 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            font: `${selected ? '600' : '400'} 15px/22px var(--font-sans)`,
            color: selected ? 'var(--primary)' : 'var(--label-normal)',
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </p>
        {(address || category) && (
          <p
            style={{
              font: '400 12px/16px var(--font-sans)',
              color: 'var(--label-assistive)',
              margin: '2px 0 0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {[category, address].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>
    </button>
  );
}
