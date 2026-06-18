'use client';

import * as React from 'react';

interface ConfirmboxProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function Confirmbox({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel = '확인',
  cancelLabel = '취소',
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
        padding: '0 24px',
      }}
    >
      {/* 딤 배경 */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
        }}
      />

      {/* 카드 */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 320,
          background: 'var(--bg-normal)',
          borderRadius: 'var(--radius-16)',
          padding: '24px 20px 20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }}
      >
        <p
          style={{
            font: '600 17px/24px var(--font-sans)',
            color: 'var(--label-normal)',
            margin: 0,
            textAlign: 'center',
          }}
        >
          {title}
        </p>

        {body && (
          <p
            style={{
              font: '400 14px/20px var(--font-sans)',
              color: 'var(--label-alternative)',
              margin: '8px 0 0',
              textAlign: 'center',
            }}
          >
            {body}
          </p>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 'var(--radius-10)',
              border: 'none',
              background: 'var(--fill-normal)',
              font: '500 15px var(--font-sans)',
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
              height: 44,
              borderRadius: 'var(--radius-10)',
              border: 'none',
              background: 'var(--primary)',
              font: '600 15px var(--font-sans)',
              color: 'var(--static-white)',
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
