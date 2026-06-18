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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* 딤 배경 */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(43,33,30,0.61)',
        }}
      />

      {/* 카드 */}
      <div
        className={cn(className)}
        style={{
          position: 'relative',
          width: 334,
          background: 'var(--bg-normal)',
          borderRadius: 'var(--radius-12)',
          padding: '32px 24px',
          boxShadow: 'var(--shadow-xlarge)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <p
          style={{
            font: '400 14px/20px var(--font-sans)',
            color: 'var(--label-alternative)',
            margin: 0,
            textAlign: 'center',
          }}
        >
          {title}
        </p>

        {body && (
          <p
            style={{
              font: '400 13px/18px var(--font-sans)',
              color: 'var(--label-assistive)',
              margin: 0,
              textAlign: 'center',
            }}
          >
            {body}
          </p>
        )}

        <div style={{ display: 'flex', gap: 12, width: '100%' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              height: 48,
              borderRadius: 'var(--radius-12)',
              border: '1px solid var(--line-normal)',
              background: 'var(--bg-normal)',
              font: '600 16px var(--font-sans)',
              color: 'var(--label-normal)',
              cursor: 'pointer',
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              height: 48,
              borderRadius: 'var(--radius-12)',
              border: '1px solid var(--line-neutral)',
              background: 'var(--bg-normal)',
              font: '600 16px var(--font-sans)',
              color: 'var(--primary)',
              cursor: 'pointer',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
