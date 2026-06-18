'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface ToggleProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export function Toggle({
  checked,
  onChange,
  disabled = false,
  label,
  className,
}: ToggleProps) {
  return (
    <label
      className={cn(className)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        style={{ display: 'none' }}
      />
      {/* 트랙 */}
      <span
        style={{
          width: 51,
          height: 31,
          borderRadius: 'var(--radius-full)',
          background: checked ? 'var(--primary)' : 'var(--fill-normal)',
          position: 'relative',
          flexShrink: 0,
          transition: 'background 0.2s',
        }}
      >
        {/* 원 */}
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: checked ? 'calc(100% - 29px)' : 2,
            width: 27,
            height: 27,
            borderRadius: '50%',
            background: 'var(--static-white)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            transition: 'left 0.2s',
          }}
        />
      </span>

      {label && (
        <span
          style={{
            font: '400 15px/22px var(--font-sans)',
            color: 'var(--label-normal)',
          }}
        >
          {label}
        </span>
      )}
    </label>
  );
}
