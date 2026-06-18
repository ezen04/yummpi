'use client';

import * as React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  required?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
}

export function Input({
  label,
  required,
  leftIcon,
  rightIcon,
  error,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const [focused, setFocused] = React.useState(false);

  const border = error
    ? '1px solid rgba(255,66,66,0.28)'
    : focused
    ? '2px solid rgba(233,75,53,0.43)'
    : '1px solid var(--line-normal)';

  const paddingLeft = leftIcon ? 44 : 16;
  const paddingRight = rightIcon ? 44 : 16;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
      {label && (
        <label style={{ font: '500 14px/20px var(--font-sans)', color: 'var(--label-normal)' }}>
          {label}
          {required && (
            <span style={{ color: 'var(--primary)', marginLeft: 2 }}>•</span>
          )}
        </label>
      )}

      <div style={{ position: 'relative', width: '100%' }}>
        {leftIcon && (
          <span
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--label-assistive)',
              pointerEvents: 'none',
            }}
          >
            {leftIcon}
          </span>
        )}
        <input
          className="placeholder:text-[var(--label-assistive)]"
          style={{
            height: 48,
            width: '100%',
            padding: `0 ${paddingRight}px 0 ${paddingLeft}px`,
            borderRadius: 'var(--radius-12)',
            border,
            background: 'var(--bg-alternative)',
            font: '400 16px var(--font-sans)',
            color: 'var(--label-normal)',
            outline: 'none',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          {...props}
        />
        {rightIcon && (
          <span
            style={{
              position: 'absolute',
              right: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--label-assistive)',
              pointerEvents: 'none',
            }}
          >
            {rightIcon}
          </span>
        )}
      </div>

      {error && (
        <p style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--status-negative)', margin: 0 }}>
          {error}
        </p>
      )}
    </div>
  );
}
