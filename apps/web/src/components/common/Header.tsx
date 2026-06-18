'use client';

import { ChevronLeft, Close, Settings, Bell } from '@yummpi/ui';
import { Badge, type BadgeVariant } from './Badge';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  greeting?: string;
  onBack?: () => void;
  onClose?: () => void;
  onSettings?: () => void;
  showBell?: boolean;
  hasNotification?: boolean;
  /** @deprecated badge 대신 statusVariant + statusLabel 사용 */
  badge?: string;
  /** title-status variant용 */
  statusVariant?: BadgeVariant;
  statusLabel?: string;
  /** mypage variant */
  isMypage?: boolean;
}

export function Header({
  title,
  subtitle,
  greeting,
  onBack,
  onClose,
  onSettings,
  showBell,
  hasNotification,
  badge,
  statusVariant,
  statusLabel,
  isMypage,
}: HeaderProps) {
  const isDashboard = !!greeting;

  // mypage: 중앙 타이틀 + 오른쪽 설정 아이콘
  if (isMypage) {
    return (
      <header
        style={{
          height: 56,
          background: 'var(--bg-normal)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingLeft: 12,
          paddingRight: 12,
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <span style={{ font: '600 18px/26px var(--font-sans)', color: 'var(--label-normal)' }}>
          {title ?? '마이페이지'}
        </span>
        {onSettings && (
          <button
            onClick={onSettings}
            style={{
              position: 'absolute',
              right: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--label-normal)',
            }}
          >
            <Settings size={22} strokeWidth={1.5} />
          </button>
        )}
      </header>
    );
  }

  return (
    <header
      style={{
        height: 56,
        background: 'var(--bg-normal)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: isDashboard ? 20 : 8,
        paddingRight: isDashboard ? 20 : 12,
        flexShrink: 0,
      }}
    >
      {/* 왼쪽 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
        {onBack && (
          <button
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
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
            <p style={{ fontSize: 14, fontWeight: 400, color: 'var(--label-alternative)', lineHeight: '20px' }}>
              {greeting}
            </p>
            <p style={{ fontSize: 19, fontWeight: 600, color: 'var(--label-normal)', lineHeight: '30px' }}>
              {title}
            </p>
          </div>
        ) : (
          <div>
            {title && (
              <p style={{ fontSize: 18, fontWeight: 400, color: 'var(--label-normal)', lineHeight: '26px' }}>
                {title}
              </p>
            )}
            {subtitle && (
              <p style={{ fontSize: 12, fontWeight: 400, color: 'var(--label-alternative)', lineHeight: '16px', marginTop: 1 }}>
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>

      {/* 오른쪽 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {statusVariant && statusLabel && (
          <Badge variant={statusVariant}>{statusLabel}</Badge>
        )}
        {badge && !statusVariant && (
          <Badge variant="green">{badge}</Badge>
        )}

        {showBell && (
          <button
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 42,
              height: 42,
              background: 'var(--bg-alternative)',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--label-normal)',
            }}
          >
            <Bell size={22} strokeWidth={1.5} />
            {hasNotification && (
              <span
                style={{
                  position: 'absolute',
                  top: 9,
                  right: 10,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'var(--primary)',
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
              width: 40,
              height: 40,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--label-normal)',
            }}
          >
            <Settings size={22} strokeWidth={1.5} />
          </button>
        )}

        {onClose && (
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--label-normal)',
            }}
          >
            <Close size={22} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </header>
  );
}
