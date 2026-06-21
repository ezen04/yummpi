'use client';

import type { ReactNode } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  isPending?: boolean;
  errorMessage?: string;
  children: ReactNode;
};

export function PaymentConfirmbox({
  open,
  onClose,
  onConfirm,
  confirmLabel = '확인',
  cancelLabel = '취소',
  isPending = false,
  errorMessage,
  children,
}: Props) {
  if (!open) return null;

  function handleOverlayClick() {
    if (!isPending) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center px-7 bg-[var(--overlay)]"
      onClick={handleOverlayClick}
    >
      <div
        className="w-full max-w-[320px] bg-[var(--bg-normal)] rounded-[20px] px-6 pt-[30px] pb-[22px] text-center shadow-[var(--shadow-large)]"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
        {errorMessage && (
          <p className="text-xs text-[var(--status-negative)] mt-3">
            {errorMessage}
          </p>
        )}
        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex-1 h-[52px] rounded-[14px] border border-[var(--line-neutral)] bg-[var(--bg-normal)] text-[var(--label-normal)] text-[17px] font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-default"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 h-[52px] rounded-[14px] border border-[var(--primary-border)] bg-[var(--bg-normal)] text-[var(--primary)] text-[17px] font-bold cursor-pointer disabled:opacity-50 disabled:cursor-default"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
