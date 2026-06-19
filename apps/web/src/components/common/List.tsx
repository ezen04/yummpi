'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check, ChevronRight } from '@yummpi/ui';
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
      className={cn(
        'flex items-center gap-3 py-[10px]',
        isInactive ? 'opacity-45' : 'opacity-100',
        className,
      )}
    >
      <YAvatar
        variant={isHost ? 'host' : 'guest'}
        src={avatarSrc}
        name={name}
        size={40}
      />

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-[15px] leading-[22px] font-[var(--font-sans)] text-[var(--label-normal)] m-0 flex items-center gap-[6px]',
            variant === 'me' ? 'font-semibold' : 'font-normal',
          )}
        >
          {name}
          {variant === 'me' && (
            <span className="text-[12px] font-normal font-[var(--font-sans)] text-[var(--label-assistive)]">
              나
            </span>
          )}
        </p>
        {isHost && (
          <p className="text-[12px] font-normal font-[var(--font-sans)] text-[var(--primary)] mt-[1px] mb-0">
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
    <div className={cn('flex items-center gap-3 py-[10px]', className)}>
      <YAvatar variant="guest" src={avatarSrc} name={name} size={40} />
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-[15px] leading-[22px] font-[var(--font-sans)] text-[var(--label-normal)] m-0 flex items-center gap-[6px]',
            isMe ? 'font-semibold' : 'font-normal',
          )}
        >
          {name}
          {isMe && (
            <span className="text-[12px] font-normal font-[var(--font-sans)] text-[var(--label-assistive)]">
              나
            </span>
          )}
        </p>
      </div>
      <span
        className={cn(
          'w-6 h-6 rounded-full inline-flex items-center justify-center shrink-0',
          attended
            ? 'bg-[var(--primary)] border-none'
            : 'border-[1.5px] border-[var(--line-normal)] bg-transparent',
        )}
      >
        {attended && <Check size={13} strokeWidth={1.6} color="white" />}
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
    <div className={cn('flex items-center gap-3 py-[10px]', className)}>
      <YAvatar
        variant={isHost ? 'host' : 'guest'}
        src={avatarSrc}
        name={name}
        size={40}
      />
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-[15px] leading-[22px] font-[var(--font-sans)] text-[var(--label-normal)] m-0 flex items-center gap-[6px]',
            isMe ? 'font-semibold' : 'font-normal',
          )}
        >
          {name}
          {isMe && (
            <span className="text-[12px] font-normal font-[var(--font-sans)] text-[var(--label-assistive)]">
              나
            </span>
          )}
        </p>
      </div>
      <span
        className="text-[13px] font-medium font-[var(--font-sans)] shrink-0"
        style={{ color: labelColor }}
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

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-[var(--radius-10)]',
        isR
          ? 'bg-[var(--primary-tint)] border border-[var(--primary)]'
          : 'bg-[var(--fill-alternative)] border border-[var(--line-normal)]',
        className,
      )}
    >
      <span
        className={cn(
          'w-7 h-7 rounded-full text-[var(--static-white)] text-[13px] font-bold font-[var(--font-sans)] inline-flex items-center justify-center shrink-0',
          isR ? 'bg-[var(--primary)]' : 'bg-[var(--label-assistive)]',
        )}
      >
        {rank}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] leading-[22px] font-semibold font-[var(--font-sans)] text-[var(--label-normal)] m-0 truncate">
          {label}
        </p>
        {address && (
          <p className="text-[12px] leading-4 font-normal font-[var(--font-sans)] text-[var(--label-assistive)] mt-[2px] mb-0 truncate">
            {address}
          </p>
        )}
      </div>
      <div className="text-right shrink-0">
        <p
          className={cn(
            'text-[14px] font-semibold font-[var(--font-sans)] m-0',
            isR ? 'text-[var(--primary)]' : 'text-[var(--label-normal)]',
          )}
        >
          {votes}표
        </p>
        <p className="text-[11px] font-normal font-[var(--font-sans)] text-[var(--label-assistive)] mt-[2px] mb-0">
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
      className={cn(
        'w-full flex items-center gap-3 py-[14px] bg-transparent border-none cursor-pointer text-left',
        className,
      )}
    >
      {icon && (
        <span
          className={cn(
            'shrink-0',
            destructive ? 'text-[var(--status-negative)]' : 'text-[var(--label-alternative)]',
          )}
        >
          {icon}
        </span>
      )}
      <span
        className={cn(
          'flex-1 text-[15px] leading-[22px] font-normal font-[var(--font-sans)]',
          destructive ? 'text-[var(--status-negative)]' : 'text-[var(--label-normal)]',
        )}
      >
        {label}
      </span>
      {value && (
        <span className="text-[14px] font-normal font-[var(--font-sans)] text-[var(--label-assistive)]">
          {value}
        </span>
      )}
      {!value && (
        <ChevronRight size={16} strokeWidth={1.5} color="var(--label-assistive)" className="shrink-0" />
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
      className={cn(
        'w-full flex items-center gap-3 py-3 bg-transparent border-none cursor-pointer text-left',
        className,
      )}
    >
      <span
        className={cn(
          'w-[22px] h-[22px] rounded-[var(--radius-6)] inline-flex items-center justify-center shrink-0',
          isActive
            ? 'bg-[var(--primary)] border-none'
            : 'border-[1.5px] border-[var(--line-normal)] bg-transparent',
        )}
      >
        {isActive && <Check size={12} strokeWidth={1.6} color="white" />}
      </span>
      <span
        className={cn(
          'flex-1 text-[15px] leading-[22px] font-[var(--font-sans)]',
          isActive ? 'font-medium text-[var(--label-normal)]' : 'font-normal text-[var(--label-alternative)]',
        )}
      >
        {label}
      </span>
      {price !== undefined && (
        <span
          className={cn(
            'text-[14px] font-[var(--font-sans)] shrink-0',
            isActive ? 'font-semibold text-[var(--label-normal)]' : 'font-normal text-[var(--label-assistive)]',
          )}
        >
          {price.toLocaleString()}원
        </span>
      )}
    </button>
  );
}
