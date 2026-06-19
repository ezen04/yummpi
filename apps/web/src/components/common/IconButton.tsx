'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type IconButtonVariant =
  | 'normal'
  | 'hover'
  | 'clicked'
  | 'done'
  | 'draft'
  | 'disabled';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  icon: React.ReactNode;
  size?: number;
  shape?: 'circle' | 'square';
}

const VARIANT_CLASSES: Record<IconButtonVariant, string> = {
  normal: 'bg-[var(--bg-alternative)] text-[var(--label-normal)]',
  hover: 'bg-[var(--fill-normal)] text-[var(--label-normal)]',
  clicked:
    'bg-[var(--primary-tint)] text-[var(--primary)] border-[1.5px] border-[var(--primary)]',
  done: 'bg-[var(--primary)] text-[var(--static-white)]',
  draft:
    'bg-[var(--fill-alternative)] text-[var(--label-assistive)] border border-dashed border-[var(--line-alternative)]',
  disabled:
    'bg-[var(--fill-disable)] text-[var(--label-disable)] cursor-default pointer-events-none',
};

export function IconButton({
  variant = 'normal',
  icon,
  size = 44,
  shape = 'circle',
  ...props
}: IconButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center shrink-0 cursor-pointer transition-[background,color] duration-150',
        shape === 'circle' ? 'rounded-full' : 'rounded-[var(--radius-12)]',
        VARIANT_CLASSES[variant],
      )}
      style={{ width: size, height: size }}
      disabled={variant === 'disabled'}
      {...props}
    >
      {icon}
    </button>
  );
}
