import * as React from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant =
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
  { classes: string; dotClass: string; dot: boolean }
> = {
  black: {
    classes: 'bg-[var(--bg-inverse)] text-[var(--inverse-label)]',
    dotClass: 'bg-[var(--inverse-label)]',
    dot: true,
  },
  green: {
    classes: 'bg-[var(--status-positive-tint)] text-[var(--status-positive)]',
    dotClass: 'bg-[var(--status-positive)]',
    dot: true,
  },
  red: {
    classes: 'bg-[var(--status-negative-tint)] text-[var(--status-negative)]',
    dotClass: 'bg-[var(--status-negative)]',
    dot: true,
  },
  yellow: {
    classes: 'bg-[var(--secondary-tint)] text-[var(--secondary-strong)]',
    dotClass: 'bg-[var(--secondary-strong)]',
    dot: true,
  },
  guest: {
    classes: 'bg-[var(--fill-normal)] text-[var(--label-alternative)]',
    dotClass: '',
    dot: false,
  },
  unpaid: {
    classes: 'bg-[var(--status-negative-tint)] text-[var(--status-negative)]',
    dotClass: '',
    dot: false,
  },
  reservable: {
    classes: 'bg-[var(--secondary-tint)] text-[var(--secondary-strong)]',
    dotClass: '',
    dot: false,
  },
  'icon-red': {
    classes: 'bg-[var(--status-negative-tint)] text-[var(--status-negative)]',
    dotClass: '',
    dot: false,
  },
};

export function Badge({ variant, children, icon, className }: BadgeProps) {
  const { classes, dotClass, dot } = STYLES[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-[var(--radius-8)] px-[6px] py-1',
        'text-[12px] font-semibold font-[var(--font-sans)] whitespace-nowrap',
        classes,
        className
      )}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotClass)} />
      )}
      {icon && <span className="flex items-center shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
