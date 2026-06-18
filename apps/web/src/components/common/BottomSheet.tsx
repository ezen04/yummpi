'use client';

import * as React from 'react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  variant?: 'background' | 'non-background' | 'solo';
  title?: string;
  children: React.ReactNode;
}

export function BottomSheet({
  open,
  onClose,
  variant = 'background',
  title,
  children,
}: BottomSheetProps) {
  const hasDim = variant === 'background' || variant === 'solo';

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
      {/* 딤 배경 */}
      {hasDim && (
        <div
          onClick={onClose}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(43,33,30,0.61)',
            animation: 'bs-fade-in 0.2s ease',
          }}
        />
      )}

      {/* 시트 패널 */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--bg-normal)',
          borderRadius: '36px 36px 0 0',
          padding: `12px 12px max(32px, env(safe-area-inset-bottom))`,
          boxShadow: 'var(--shadow-xlarge)',
          animation: 'bs-slide-up 0.25s ease',
        }}
      >
        {/* 핸들바 */}
        <div
          style={{
            width: 76,
            height: 4,
            borderRadius: 10,
            background: 'var(--fill-strong)',
            margin: '0 auto 16px',
          }}
        />

        {/* 타이틀 (solo는 없음) */}
        {title && variant !== 'solo' && (
          <p
            style={{
              font: '600 17px/24px var(--font-sans)',
              color: 'var(--label-normal)',
              marginBottom: 16,
            }}
          >
            {title}
          </p>
        )}

        {children}
      </div>

      <style>{`
        @keyframes bs-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes bs-slide-up {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
