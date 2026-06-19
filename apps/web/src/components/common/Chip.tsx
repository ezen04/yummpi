'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

// ── Outline Chip (기존) ─────────────────────────────────────

interface ChipProps {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function Chip({
  active = false,
  onClick,
  children,
  disabled = false,
  className,
}: ChipProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center h-[34px] px-3 rounded-[var(--radius-10)]',
        'text-[14px] font-medium font-[var(--font-sans)] whitespace-nowrap',
        'transition-[background,border,color] duration-150',
        active
          ? 'border border-[var(--primary-border)] bg-[var(--primary-tint)] text-[var(--primary)]'
          : 'border-[1.5px] border-[var(--line-normal)] bg-transparent text-[var(--label-alternative)]',
        disabled ? 'cursor-default opacity-40' : 'cursor-pointer',
        className,
      )}
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
  className?: string;
}

const SOLID_CLASSES: Record<SolidChipVariant, string> = {
  'solid-dark': 'bg-[var(--bg-inverse)] text-[var(--inverse-label)] font-medium',
  'solid-fill': 'bg-[var(--fill-normal)] text-[var(--label-alternative)] font-normal',
};

export function SolidChip({
  variant,
  onClick,
  children,
  disabled = false,
  className,
}: SolidChipProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center h-8 px-[14px] rounded-[var(--radius-full)]',
        'text-[13px] font-[var(--font-sans)] whitespace-nowrap',
        'transition-opacity duration-150',
        disabled ? 'cursor-default opacity-40' : 'cursor-pointer',
        SOLID_CLASSES[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}
