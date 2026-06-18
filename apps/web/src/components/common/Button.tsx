'use client';

import * as React from 'react';

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
        <linearGradient id="toss-a" x1="4" y1="4" x2="18" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5AAAFF" />
          <stop offset="100%" stopColor="#0051FF" />
        </linearGradient>
        <linearGradient id="toss-b" x1="8" y1="6" x2="16" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#80BFFF" />
          <stop offset="100%" stopColor="#0064FF" />
        </linearGradient>
      </defs>
      <ellipse cx="10" cy="11" rx="5.5" ry="7.5" fill="url(#toss-a)" transform="rotate(-12 10 11)" />
      <ellipse cx="13" cy="10" rx="4.5" ry="6.5" fill="url(#toss-b)" opacity="0.85" transform="rotate(10 13 10)" />
    </svg>
  );
}

// ── 브랜드 버튼 ────────────────────────────────────────────

interface BrandButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

const BRAND_BASE: React.CSSProperties = {
  height: 48,
  width: '100%',
  borderRadius: 'var(--radius-12)',
  border: 'none',
  font: '600 16px var(--font-sans)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
};

export function KakaoLoginButton({ children = '카카오로 시작하기', ...props }: BrandButtonProps) {
  return (
    <button
      style={{ ...BRAND_BASE, background: 'var(--brand-kakao)', color: 'rgba(0,0,0,0.85)' }}
      {...props}
    >
      <KakaoIcon />
      {children}
    </button>
  );
}

export function KakaoPayButton({ children = '카카오페이로 송금', ...props }: BrandButtonProps) {
  return (
    <button
      style={{ ...BRAND_BASE, background: 'var(--brand-kakao)', color: 'rgba(0,0,0,0.85)' }}
      {...props}
    >
      <KakaoIcon />
      {children}
    </button>
  );
}

export function TossPayButton({ children = '토스로 송금', ...props }: BrandButtonProps) {
  return (
    <button
      style={{ ...BRAND_BASE, background: 'var(--brand-toss)', color: 'var(--static-white)' }}
      {...props}
    >
      <TossIcon />
      {children}
    </button>
  );
}

// ── Radius 소형 버튼 ───────────────────────────────────────

type RadiusVariant = 'radius' | 'radius-border' | 'radius-border-colored' | 'radius-border-inactive' | 'radius-border-selected';

interface RadiusButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: RadiusVariant;
  children: React.ReactNode;
}

const RADIUS_STYLES: Record<RadiusVariant, React.CSSProperties> = {
  'radius': {
    background: 'var(--fill-normal)',
    color: 'var(--label-alternative)',
    border: 'none',
  },
  'radius-border': {
    background: 'transparent',
    color: 'var(--label-normal)',
    border: '1px solid var(--line-normal)',
  },
  'radius-border-colored': {
    background: 'transparent',
    color: 'var(--primary)',
    border: '1px solid var(--primary)',
  },
  'radius-border-inactive': {
    background: 'var(--fill-disable)',
    color: 'var(--label-disable)',
    border: '1px solid var(--line-alternative)',
    cursor: 'default',
  },
  'radius-border-selected': {
    background: 'rgba(233,75,53,0.08)',
    color: 'var(--primary)',
    border: '1.5px solid var(--primary)',
  },
};

export function RadiusButton({ variant = 'radius', children, ...props }: RadiusButtonProps) {
  const variantStyle = RADIUS_STYLES[variant];

  return (
    <button
      style={{
        height: 32,
        padding: '0 14px',
        borderRadius: 'var(--radius-full)',
        font: '600 13px var(--font-sans)',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        ...variantStyle,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
