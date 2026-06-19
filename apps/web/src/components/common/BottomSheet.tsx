'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  variant?: 'background' | 'non-background' | 'solo';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function BottomSheet({
  open,
  onClose,
  variant = 'background',
  title,
  children,
  className,
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
    <div className="fixed inset-0 z-[200]">
      {/* 딤 배경 */}
      {hasDim && (
        <div
          onClick={onClose}
          className="absolute inset-0 bg-[var(--overlay)]"
          style={{ animation: 'bs-fade-in 0.2s ease' }}
        />
      )}

      {/* 시트 패널 */}
      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 bg-[var(--bg-normal)]',
          'rounded-tl-[36px] rounded-tr-[36px] px-3 pt-3',
          'shadow-[var(--shadow-large)]',
          className
        )}
        style={{
          paddingBottom: 'max(32px, env(safe-area-inset-bottom))',
          animation: 'bs-slide-up 0.25s ease',
        }}
      >
        {/* 핸들바 */}
        <div className="w-[76px] h-1 rounded-[10px] bg-[var(--fill-strong)] mx-auto mb-4" />

        {/* 타이틀 (solo는 없음) */}
        {title && variant !== 'solo' && (
          <p className="text-[17px] leading-6 font-semibold font-[var(--font-sans)] text-[var(--label-normal)] mb-4">
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
