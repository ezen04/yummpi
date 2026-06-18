'use client';

import * as React from 'react';

interface ChipProps {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

export function Chip({ active = false, onClick, children, disabled = false }: ChipProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 32,
        padding: '0 14px',
        borderRadius: 'var(--radius-full)',
        border: active ? '1.5px solid var(--primary)' : '1.5px solid var(--line-normal)',
        background: active ? 'rgba(233,75,53,0.06)' : 'transparent',
        font: `${active ? '600' : '400'} 13px var(--font-sans)`,
        color: active ? 'var(--primary)' : 'var(--label-alternative)',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
        transition: 'background 0.15s, border 0.15s, color 0.15s',
      }}
    >
      {children}
    </button>
  );
}
