'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface RadioProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  value?: string;
  className?: string;
}

export function Radio({
  checked,
  onChange,
  label,
  disabled = false,
  className,
}: RadioProps) {
  return (
    <label
      className={cn(
        'inline-flex items-center gap-[10px]',
        disabled ? 'cursor-default opacity-40' : 'cursor-pointer',
        !disabled && !checked && 'hover:opacity-80',
        !disabled && 'active:opacity-70 transition-opacity',
        className
      )}
    >
      <input
        type="radio"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="sr-only"
      />
      <span
        className={cn(
          'w-5 h-5 rounded-full flex items-center justify-center shrink-0',
          'bg-[var(--bg-normal)] transition-[border] duration-150',
          checked
            ? 'border-2 border-[var(--primary)]'
            : 'border-[1.5px] border-[var(--line-normal)]'
        )}
      >
        {checked && (
          <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />
        )}
      </span>

      {label && (
        <span
          className={cn(
            'text-[15px] leading-[22px] font-normal font-[var(--font-sans)]',
            checked
              ? 'text-[var(--label-normal)]'
              : 'text-[var(--label-alternative)]'
          )}
        >
          {label}
        </span>
      )}
    </label>
  );
}

interface RadioGroupProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function RadioGroup({
  options,
  value,
  onChange,
  disabled,
  className,
}: RadioGroupProps) {
  return (
    <div className={cn('flex flex-col gap-[14px]', className)}>
      {options.map((opt) => (
        <Radio
          key={opt.value}
          checked={value === opt.value}
          onChange={() => onChange(opt.value)}
          label={opt.label}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
