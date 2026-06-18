'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
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
  className?: string;
}

export function PersonItem({
  variant,
  name,
  avatarSrc,
  isHost,
  status,
  className,
}: PersonItemProps) {
  const isInactive = variant === 'other-inactive';

  return (
    <div
      className={cn(className)}
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
            <span
              style={{
                font: '400 12px var(--font-sans)',
                color: 'var(--label-assistive)',
              }}
            >
              나
            </span>
          )}
        </p>
        {isHost && (
          <p
            style={{
              font: '400 12px var(--font-sans)',
              color: 'var(--primary)',
              margin: '1px 0 0',
            }}
          >
            주최자
          </p>
        )}
      </div>

      {status && (
        <Badge
          variant={
            status === 'unpaid'
              ? 'unpaid'
              : status === 'paid'
                ? 'green'
                : 'guest'
          }
        >
          {status === 'unpaid' ? '미송금' : status === 'paid' ? '완료' : '면제'}
        </Badge>
      )}
    </div>
  );
}

// ── Person/me/attendance ────────────────────────────────────

interface PersonAttendanceItemProps {
  name: string;
  avatarSrc?: string;
  attended?: boolean;
  isMe?: boolean;
  className?: string;
}

export function PersonAttendanceItem({
  name,
  avatarSrc,
  attended = false,
  isMe = false,
  className,
}: PersonAttendanceItemProps) {
  return (
    <div
      className={cn(className)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 0',
      }}
    >
      <YAvatar variant="guest" src={avatarSrc} name={name} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            font: `${isMe ? '600' : '400'} 15px/22px var(--font-sans)`,
            color: 'var(--label-normal)',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {name}
          {isMe && (
            <span
              style={{
                font: '400 12px var(--font-sans)',
                color: 'var(--label-assistive)',
              }}
            >
              나
            </span>
          )}
        </p>
      </div>
      <span
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          border: attended ? 'none' : '1.5px solid var(--line-normal)',
          background: attended ? 'var(--primary)' : 'transparent',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {attended && (
          <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
            <path
              d="M1 5L4.5 8.5L12 1"
              stroke="white"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
    </div>
  );
}

// ── Person/me/result & Person/other/result ──────────────────

interface PersonResultItemProps {
  name: string;
  avatarSrc?: string;
  isMe?: boolean;
  isHost?: boolean;
  resultLabel: string;
  resultVariant?: 'primary' | 'secondary' | 'default';
  className?: string;
}

export function PersonResultItem({
  name,
  avatarSrc,
  isMe,
  isHost,
  resultLabel,
  resultVariant = 'default',
  className,
}: PersonResultItemProps) {
  const labelColor =
    resultVariant === 'primary'
      ? 'var(--primary)'
      : resultVariant === 'secondary'
        ? 'var(--secondary)'
        : 'var(--label-assistive)';

  return (
    <div
      className={cn(className)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 0',
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
            font: `${isMe ? '600' : '400'} 15px/22px var(--font-sans)`,
            color: 'var(--label-normal)',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {name}
          {isMe && (
            <span
              style={{
                font: '400 12px var(--font-sans)',
                color: 'var(--label-assistive)',
              }}
            >
              나
            </span>
          )}
        </p>
      </div>
      <span
        style={{
          font: '500 13px var(--font-sans)',
          color: labelColor,
          flexShrink: 0,
        }}
      >
        {resultLabel}
      </span>
    </div>
  );
}

// ── result-r / result-b (투표 결과 장소 행) ─────────────────

interface ResultRowProps {
  rank: number;
  label: string;
  address?: string;
  votes: number;
  percent: number;
  variant: 'r' | 'b';
  className?: string;
}

export function ResultRow({
  rank,
  label,
  address,
  votes,
  percent,
  variant,
  className,
}: ResultRowProps) {
  const isR = variant === 'r';
  const accentColor = isR ? 'var(--primary)' : 'var(--secondary)';
  const bgColor = isR ? 'rgba(233,75,53,0.06)' : 'rgba(0,118,230,0.06)';

  return (
    <div
      className={cn(className)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        borderRadius: 'var(--radius-10)',
        background: bgColor,
        border: `1px solid ${accentColor}`,
      }}
    >
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: accentColor,
          color: 'var(--static-white)',
          font: '700 13px var(--font-sans)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {rank}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            font: '600 15px/22px var(--font-sans)',
            color: 'var(--label-normal)',
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </p>
        {address && (
          <p
            style={{
              font: '400 12px/16px var(--font-sans)',
              color: 'var(--label-assistive)',
              margin: '2px 0 0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {address}
          </p>
        )}
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <p
          style={{
            font: '600 14px var(--font-sans)',
            color: accentColor,
            margin: 0,
          }}
        >
          {votes}표
        </p>
        <p
          style={{
            font: '400 11px var(--font-sans)',
            color: 'var(--label-assistive)',
            margin: '2px 0 0',
          }}
        >
          {percent}%
        </p>
      </div>
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
  className?: string;
}

export function MenuItem({
  icon,
  label,
  value,
  onClick,
  destructive = false,
  className,
}: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(className)}
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
        <span
          style={{
            color: destructive
              ? 'var(--status-negative)'
              : 'var(--label-alternative)',
            flexShrink: 0,
          }}
        >
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
        <span
          style={{
            font: '400 14px var(--font-sans)',
            color: 'var(--label-assistive)',
          }}
        >
          {value}
        </span>
      )}
      {!value && (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          style={{ flexShrink: 0 }}
        >
          <path
            d="M6 4L10 8L6 12"
            stroke="var(--label-assistive)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

// ── Menu-check 아이템 (OCR 검수용) ─────────────────────────

interface MenuCheckItemProps {
  label: string;
  price?: number;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  variant?: 'active' | 'inactive';
  className?: string;
}

export function MenuCheckItem({
  label,
  price,
  checked = false,
  onChange,
  variant,
  className,
}: MenuCheckItemProps) {
  const isActive = variant === 'active' || checked;

  return (
    <button
      onClick={() => onChange?.(!isActive)}
      className={cn(className)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 0',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      {/* 체크박스 */}
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: 'var(--radius-6)',
          border: isActive ? 'none' : '1.5px solid var(--line-normal)',
          background: isActive ? 'var(--primary)' : 'transparent',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {isActive && (
          <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
            <path
              d="M1 4L4.5 7.5L11 1"
              stroke="white"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span
        style={{
          flex: 1,
          font: `${isActive ? '500' : '400'} 15px/22px var(--font-sans)`,
          color: isActive ? 'var(--label-normal)' : 'var(--label-alternative)',
        }}
      >
        {label}
      </span>
      {price !== undefined && (
        <span
          style={{
            font: `${isActive ? '600' : '400'} 14px var(--font-sans)`,
            color: isActive ? 'var(--label-normal)' : 'var(--label-assistive)',
            flexShrink: 0,
          }}
        >
          {price.toLocaleString()}원
        </span>
      )}
    </button>
  );
}
