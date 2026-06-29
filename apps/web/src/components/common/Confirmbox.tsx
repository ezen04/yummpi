'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface ConfirmboxProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  className?: string;
}

export function Confirmbox({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel = '확인',
  cancelLabel = '취소',
  className,
}: ConfirmboxProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] mx-auto flex max-w-[480px] items-center justify-center">
      <div onClick={onClose} className="absolute inset-0 bg-[var(--overlay)]" />

      <div
        className={cn(
          'relative w-[334px] bg-[var(--bg-normal)] rounded-[var(--radius-12)]',
          'px-6 py-8 shadow-[var(--shadow-large)] flex flex-col items-center gap-4',
          className
        )}
      >
        <p className="text-[14px] leading-5 font-normal font-[var(--font-sans)] text-[var(--label-alternative)] m-0 text-center">
          {title}
        </p>

        {body && (
          <p className="text-[13px] leading-[18px] font-normal font-[var(--font-sans)] text-[var(--label-assistive)] m-0 text-center">
            {body}
          </p>
        )}

        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 h-12 rounded-[var(--radius-12)] border border-[var(--line-normal)] bg-[var(--bg-normal)] text-[16px] font-semibold font-[var(--font-sans)] text-[var(--label-normal)] cursor-pointer transition-colors hover:bg-[var(--fill-normal)] active:bg-[var(--fill-strong)]"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-12 rounded-[var(--radius-12)] border border-[var(--line-neutral)] bg-[var(--bg-normal)] text-[16px] font-semibold font-[var(--font-sans)] text-[var(--primary)] cursor-pointer transition-colors hover:bg-[var(--primary-tint)] active:opacity-80"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
