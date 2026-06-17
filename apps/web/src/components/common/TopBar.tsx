'use client';

import { ChevronLeft, Close, Settings, Bell } from '@yummpi/ui';

interface TopBarProps {
  title?: string;
  subtitle?: string;
  greeting?: string;
  onBack?: () => void;
  onClose?: () => void;
  onSettings?: () => void;
  showBell?: boolean;
  hasNotification?: boolean;
  badge?: string;
}

export function TopBar({
  title,
  subtitle,
  greeting,
  onBack,
  onClose,
  onSettings,
  showBell,
  hasNotification,
  badge,
}: TopBarProps) {
  return (
    <header
      style={{
        height: 56,
        background: 'var(--bg-normal)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        flexShrink: 0,
      }}
    >
      {/* 왼쪽 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
        {onBack && (
          <button
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              marginLeft: -8,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--label-normal)',
              flexShrink: 0,
            }}
          >
            <ChevronLeft size={24} strokeWidth={1.5} />
          </button>
        )}

        {greeting ? (
          <div>
            <p style={{ fontSize: 13, color: 'var(--label-alternative)', lineHeight: '18px' }}>
              {greeting}
            </p>
            <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--label-strong)', lineHeight: '26px' }}>
              {title}
            </p>
          </div>
        ) : (
          <div>
            {title && (
              <p style={{ fontSize: 17, fontWeight: 600, color: 'var(--label-strong)', lineHeight: '24px' }}>
                {title}
              </p>
            )}
            {subtitle && (
              <p style={{ fontSize: 12, color: 'var(--label-alternative)', lineHeight: '16px', marginTop: 1 }}>
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>

      {/* 오른쪽 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {badge && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--status-positive)',
              padding: '4px 8px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(0,191,64,0.08)',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--status-positive)', flexShrink: 0 }} />
            {badge}
          </span>
        )}

        {showBell && (
          <button
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              background: 'var(--fill-alternative)',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--label-normal)',
            }}
          >
            <Bell size={20} strokeWidth={1.5} />
            {hasNotification && (
              <span
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'var(--status-negative)',
                  border: '1.5px solid var(--bg-normal)',
                }}
              />
            )}
          </button>
        )}

        {onSettings && (
          <button
            onClick={onSettings}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--label-normal)',
            }}
          >
            <Settings size={20} strokeWidth={1.5} />
          </button>
        )}

        {onClose && (
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--label-normal)',
            }}
          >
            <Close size={20} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </header>
  );
}
