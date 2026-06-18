'use client';

import * as React from 'react';

interface RadioProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  value?: string;
}

export function Radio({ checked, onChange, label, disabled = false }: RadioProps) {
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
        type="radio"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        style={{ display: 'none' }}
      />
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          border: checked ? '2px solid var(--primary)' : '1.5px solid var(--line-normal)',
          background: 'var(--bg-normal)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'border 0.15s',
        }}
      >
        {checked && (
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--primary)',
            }}
          />
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

interface RadioGroupProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function RadioGroup({ options, value, onChange, disabled }: RadioGroupProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
