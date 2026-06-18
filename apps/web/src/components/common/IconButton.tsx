'use client';

import * as React from 'react';

export type IconButtonVariant = 'normal' | 'hover' | 'clicked' | 'done' | 'draft' | 'disabled';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  icon: React.ReactNode;
  size?: number;
  shape?: 'circle' | 'square';
}

const VARIANT_STYLES: Record<IconButtonVariant, React.CSSProperties> = {
  normal: {
    background: 'var(--bg-alternative)',
    color: 'var(--label-normal)',
    border: 'none',
  },
  hover: {
    background: 'var(--fill-normal)',
    color: 'var(--label-normal)',
    border: 'none',
  },
  clicked: {
    background: 'rgba(233,75,53,0.10)',
    color: 'var(--primary)',
    border: '1.5px solid var(--primary)',
  },
  done: {
    background: 'var(--primary)',
    color: 'var(--static-white)',
    border: 'none',
  },
  draft: {
    background: 'var(--fill-alternative)',
    color: 'var(--label-assistive)',
    border: '1px dashed var(--line-alternative)',
  },
  disabled: {
    background: 'var(--fill-disable)',
    color: 'var(--label-disable)',
    border: 'none',
    cursor: 'default',
    pointerEvents: 'none',
  },
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
      style={{
        width: size,
        height: size,
        borderRadius: shape === 'circle' ? '50%' : 'var(--radius-12)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'background 0.15s, color 0.15s',
        flexShrink: 0,
        ...VARIANT_STYLES[variant],
      }}
      disabled={variant === 'disabled'}
      {...props}
    >
      {icon}
    </button>
  );
}
