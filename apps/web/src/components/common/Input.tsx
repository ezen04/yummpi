'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  required?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
  wrapperClassName?: string;
}

export function Input({
  label,
  required,
  leftIcon,
  rightIcon,
  error,
  onFocus,
  onBlur,
  wrapperClassName,
  ...props
}: InputProps) {
  const [focused, setFocused] = React.useState(false);

  const border = error
    ? '1px solid var(--status-negative-border)'
    : focused
      ? '2px solid var(--primary-border)'
      : '1px solid var(--line-normal)';

  const paddingLeft = leftIcon ? 44 : 16;
  const paddingRight = rightIcon ? 44 : 16;

  return (
    <div className={cn('flex flex-col gap-[6px] w-full', wrapperClassName)}>
      {label && (
        <label className="text-[14px] leading-5 font-medium font-[var(--font-sans)] text-[var(--label-normal)]">
          {label}
          {required && (
            <span className="text-[var(--primary)] ml-[2px]">•</span>
          )}
        </label>
      )}

      <div className="relative w-full">
        {leftIcon && (
          <span className="absolute left-[14px] top-1/2 -translate-y-1/2 flex items-center text-[var(--label-assistive)] pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input
          className="placeholder:text-[var(--label-assistive)] h-12 w-full rounded-[var(--radius-12)] bg-[var(--bg-normal)] text-[16px] font-normal font-[var(--font-sans)] text-[var(--label-normal)] outline-none box-border"
          style={{
            border,
            paddingLeft: paddingLeft,
            paddingRight: paddingRight,
          }}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-[14px] top-1/2 -translate-y-1/2 flex items-center text-[var(--label-assistive)] pointer-events-none">
            {rightIcon}
          </span>
        )}
      </div>

      {error && (
        <p className="text-[12px] leading-4 font-normal font-[var(--font-sans)] text-[var(--status-negative)] m-0">
          {error}
        </p>
      )}
    </div>
  );
}
