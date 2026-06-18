'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

// 표준 버튼은 @yummpi/ui에서 re-export
export { Button, type ButtonProps } from '@yummpi/ui';

// ── 브랜드 아이콘 ─────────────────────────────────────────

function KakaoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 2C5.58 2 2 5.04 2 8.8C2 11.16 3.33 13.24 5.38 14.55L4.6 17.8L8.22 15.52C8.8 15.62 9.39 15.68 10 15.68C14.42 15.68 18 12.64 18 8.88C18 5.04 14.42 2 10 2Z"
        fill="rgba(0,0,0,0.85)"
      />
    </svg>
  );
}

function TossIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <defs>
        <linearGradient
          id="toss-a"
          x1="4"
          y1="4"
          x2="18"
          y2="18"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#5AAAFF" />
          <stop offset="100%" stopColor="#0051FF" />
        </linearGradient>
        <linearGradient
          id="toss-b"
          x1="8"
          y1="6"
          x2="16"
          y2="18"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#80BFFF" />
          <stop offset="100%" stopColor="#0064FF" />
        </linearGradient>
      </defs>
      <ellipse
        cx="10"
        cy="11"
        rx="5.5"
        ry="7.5"
        fill="url(#toss-a)"
        transform="rotate(-12 10 11)"
      />
      <ellipse
        cx="13"
        cy="10"
        rx="4.5"
        ry="6.5"
        fill="url(#toss-b)"
        opacity="0.85"
        transform="rotate(10 13 10)"
      />
    </svg>
  );
}

// ── 브랜드 버튼 ────────────────────────────────────────────

interface BrandButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

const BRAND_BASE =
  'w-full h-12 rounded-[var(--radius-12)] border-none text-[16px] font-semibold font-[var(--font-sans)] cursor-pointer flex items-center justify-center gap-2';

export function KakaoLoginButton({
  children = '카카오로 시작하기',
  className,
  ...props
}: BrandButtonProps) {
  return (
    <button
      className={cn(BRAND_BASE, 'bg-[var(--brand-kakao)] text-[rgba(0,0,0,0.85)]', className)}
      {...props}
    >
      <KakaoIcon />
      {children}
    </button>
  );
}

export function KakaoPayButton({
  children = '카카오페이로 송금',
  className,
  ...props
}: BrandButtonProps) {
  return (
    <button
      className={cn(BRAND_BASE, 'bg-[var(--brand-kakao)] text-[rgba(0,0,0,0.85)]', className)}
      {...props}
    >
      <KakaoIcon />
      {children}
    </button>
  );
}

export function TossPayButton({
  children = '토스로 송금',
  className,
  ...props
}: BrandButtonProps) {
  return (
    <button
      className={cn(BRAND_BASE, 'bg-[var(--brand-toss)] text-[var(--static-white)]', className)}
      {...props}
    >
      <TossIcon />
      {children}
    </button>
  );
}

// ── Radius 소형 버튼 ───────────────────────────────────────

type RadiusVariant =
  | 'radius'
  | 'radius-border'
  | 'radius-border-colored'
  | 'radius-border-inactive'
  | 'radius-border-selected';

interface RadiusButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: RadiusVariant;
  children: React.ReactNode;
}

const RADIUS_CLASSES: Record<RadiusVariant, string> = {
  radius: 'bg-[var(--fill-normal)] text-[var(--label-alternative)]',
  'radius-border': 'bg-transparent text-[var(--label-normal)] border border-[var(--line-normal)]',
  'radius-border-colored': 'bg-transparent text-[var(--primary)] border border-[var(--primary)]',
  'radius-border-inactive':
    'bg-[var(--fill-disable)] text-[var(--label-disable)] border border-[var(--line-alternative)] cursor-default',
  'radius-border-selected':
    'bg-[rgba(233,75,53,0.08)] text-[var(--primary)] border-[1.5px] border-[var(--primary)]',
};

export function RadiusButton({
  variant = 'radius',
  children,
  className,
  ...props
}: RadiusButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-1 h-8 px-[14px]',
        'rounded-[var(--radius-full)] text-[13px] font-semibold font-[var(--font-sans)] cursor-pointer',
        RADIUS_CLASSES[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
