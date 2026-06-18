import * as React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant =
  | 'black'
  | 'green'
  | 'red'
  | 'yellow'
  | 'guest'
  | 'unpaid'
  | 'reservable'
  | 'icon-red';

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

const STYLES: Record<
  BadgeVariant,
  { background: string; color: string; dot: boolean }
> = {
  black: {
    background: 'var(--bg-inverse)',
    color: 'var(--inverse-label)',
    dot: true,
  },
  green: {
    background: 'rgba(0,191,64,0.10)',
    color: 'var(--status-positive)',
    dot: true,
  },
  red: {
    background: 'rgba(255,66,66,0.08)',
    color: 'var(--status-negative)',
    dot: true,
  },
  yellow: {
    background: 'var(--secondary-tint)',
    color: 'var(--secondary-strong)',
    dot: true,
  },
  guest: {
    background: 'var(--fill-normal)',
    color: 'var(--label-alternative)',
    dot: false,
  },
  unpaid: {
    background: 'rgba(255,66,66,0.08)',
    color: 'var(--status-negative)',
    dot: false,
  },
  reservable: {
    background: 'var(--secondary-tint)',
    color: 'var(--secondary-strong)',
    dot: false,
  },
  'icon-red': {
    background: 'rgba(255,66,66,0.08)',
    color: 'var(--status-negative)',
    dot: false,
  },
};

export function Badge({ variant, children, icon, className }: BadgeProps) {
  const { background, color, dot } = STYLES[variant];

  return (
    <span
      className={cn(className)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        borderRadius: 'var(--radius-8)',
        padding: '4px 6px',
        background,
        color,
        font: '600 12px var(--font-sans)',
        whiteSpace: 'nowrap',
      }}
    >
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: color,
            flexShrink: 0,
          }}
        />
      )}
      {icon && (
        <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {icon}
        </span>
      )}
      {children}
    </span>
  );
}
