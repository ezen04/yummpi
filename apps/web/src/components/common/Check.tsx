'use client';

import * as React from 'react';

interface CheckProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Check({
  checked,
  onChange,
  label,
  disabled = false,
}: CheckProps) {
  return (
    <label
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
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: 'var(--radius-4)',
          border: checked ? 'none' : '1.5px solid var(--line-normal)',
          background: checked ? 'var(--primary)' : 'var(--bg-normal)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'background 0.15s, border 0.15s',
        }}
      >
        {checked && (
          <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
            <path
              d="M1 5L4.5 8.5L11 1.5"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>

      {label && (
        <span
          style={{
            font: '400 15px/22px var(--font-sans)',
            color: checked ? 'var(--label-normal)' : 'var(--label-alternative)',
          }}
        >
          {label}
        </span>
      )}
    </label>
  );
}
