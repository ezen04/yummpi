'use client';

import * as React from 'react';
import { YAvatar } from './YAvatar';
import { Badge } from './Badge';

// ── Person 아이템 ───────────────────────────────────────────

interface PersonItemProps {
  variant: 'me' | 'other' | 'other-admin' | 'other-inactive';
  name: string;
  avatarSrc?: string;
  isHost?: boolean;
  status?: 'paid' | 'unpaid' | 'exempt';
  isMe?: boolean;
}

export function PersonItem({ variant, name, avatarSrc, isHost, status }: PersonItemProps) {
  const isInactive = variant === 'other-inactive';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 0',
        opacity: isInactive ? 0.45 : 1,
      }}
    >
      <YAvatar
        variant={isHost ? 'host' : 'guest'}
        src={avatarSrc}
        name={name}
        size={40}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            font: `${variant === 'me' ? '600' : '400'} 15px/22px var(--font-sans)`,
            color: 'var(--label-normal)',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {name}
          {variant === 'me' && (
            <span style={{ font: '400 12px var(--font-sans)', color: 'var(--label-assistive)' }}>
              나
            </span>
          )}
        </p>
        {isHost && (
          <p style={{ font: '400 12px var(--font-sans)', color: 'var(--primary)', margin: '1px 0 0' }}>
            주최자
          </p>
        )}
      </div>

      {status && (
        <Badge variant={status === 'unpaid' ? 'unpaid' : status === 'paid' ? 'green' : 'guest'}>
          {status === 'unpaid' ? '미송금' : status === 'paid' ? '완료' : '면제'}
        </Badge>
      )}
    </div>
  );
}

// ── Menu 아이템 ─────────────────────────────────────────────

interface MenuItemProps {
  icon?: React.ReactNode;
  label: string;
  value?: string;
  onClick?: () => void;
  destructive?: boolean;
}

export function MenuItem({ icon, label, value, onClick, destructive = false }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 0',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      {icon && (
        <span style={{ color: destructive ? 'var(--status-negative)' : 'var(--label-alternative)', flexShrink: 0 }}>
          {icon}
        </span>
      )}
      <span
        style={{
          flex: 1,
          font: '400 15px/22px var(--font-sans)',
          color: destructive ? 'var(--status-negative)' : 'var(--label-normal)',
        }}
      >
        {label}
      </span>
      {value && (
        <span style={{ font: '400 14px var(--font-sans)', color: 'var(--label-assistive)' }}>
          {value}
        </span>
      )}
      {!value && (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
          <path d="M6 4L10 8L6 12" stroke="var(--label-assistive)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
