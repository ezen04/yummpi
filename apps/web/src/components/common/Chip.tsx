'use client';

import * as React from 'react';

// ── Outline Chip (기존) ─────────────────────────────────────

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

// ── Solid Chip 추가 variants ────────────────────────────────

type SolidChipVariant = 'solid-dark' | 'solid-fill';

interface SolidChipProps {
  variant: SolidChipVariant;
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

const SOLID_STYLES: Record<SolidChipVariant, React.CSSProperties> = {
  'solid-dark': {
    background: 'var(--label-normal)',
    color: 'var(--static-white)',
    border: 'none',
    fontWeight: 600,
  },
  'solid-fill': {
    background: 'var(--fill-normal)',
    color: 'var(--label-alternative)',
    border: 'none',
    fontWeight: 400,
  },
};

export function SolidChip({ variant, onClick, children, disabled = false }: SolidChipProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 32,
        padding: '0 14px',
        borderRadius: 'var(--radius-full)',
        font: `13px var(--font-sans)`,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
        transition: 'opacity 0.15s',
        ...SOLID_STYLES[variant],
      }}
    >
      {children}
    </button>
  );
}
