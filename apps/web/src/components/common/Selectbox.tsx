'use client';

import * as React from 'react';

interface SelectboxItemProps {
  position?: 'top' | 'mid' | 'end' | 'solo';
  selected?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

const RADIUS: Record<NonNullable<SelectboxItemProps['position']>, string> = {
  top:  'var(--radius-12) var(--radius-12) 0 0',
  mid:  '0',
  end:  '0 0 var(--radius-12) var(--radius-12)',
  solo: 'var(--radius-12)',
};

export function SelectboxItem({ position = 'mid', selected = false, onClick, children }: SelectboxItemProps) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        height: 48,
        padding: '0 16px',
        borderRadius: RADIUS[position],
        border: 'none',
        background: selected
          ? 'rgba(233,75,53,0.06)'
          : hovered
          ? 'var(--fill-normal)'
          : 'var(--bg-normal)',
        font: `${selected ? '600' : '400'} 15px var(--font-sans)`,
        color: selected ? 'var(--primary)' : 'var(--label-normal)',
        cursor: 'pointer',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        transition: 'background 0.1s',
      }}
    >
      {children}
    </button>
  );
}

interface SelectboxProps {
  options: { value: string; label: string }[];
  value?: string;
  onChange?: (value: string) => void;
}

export function Selectbox({ options, value, onChange }: SelectboxProps) {
  return (
    <div
      style={{
        borderRadius: 'var(--radius-12)',
        border: '1px solid var(--line-normal)',
        overflow: 'hidden',
      }}
    >
      {options.map((opt, i) => {
        const position =
          options.length === 1 ? 'solo'
          : i === 0 ? 'top'
          : i === options.length - 1 ? 'end'
          : 'mid';

        return (
          <React.Fragment key={opt.value}>
            {i > 0 && (
              <div style={{ height: 1, background: 'var(--line-normal)', margin: '0 16px' }} />
            )}
            <SelectboxItem
              position={position}
              selected={value === opt.value}
              onClick={() => onChange?.(opt.value)}
            >
              {opt.label}
            </SelectboxItem>
          </React.Fragment>
        );
      })}
    </div>
  );
}
