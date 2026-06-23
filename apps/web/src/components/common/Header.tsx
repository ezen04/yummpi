'use client';

import { ChevronLeft, Close, Settings, Bell } from '@yummpi/ui';
import { cn } from '@/lib/utils';
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
  className?: string;
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
  className,
}: HeaderProps) {
  const isDashboard = !!greeting;

  const ICON_BTN =
    'flex items-center justify-center w-10 h-10 bg-transparent border-none cursor-pointer text-[var(--label-normal)] rounded-[var(--radius-full)] transition-colors hover:bg-[var(--fill-normal)] active:bg-[var(--fill-strong)]';

  // mypage: 중앙 타이틀 + 오른쪽 설정 아이콘
  if (isMypage) {
    return (
      <header
        className={cn(
          'h-14 box-content pt-[env(safe-area-inset-top)] bg-[var(--bg-normal)] flex items-center justify-center px-3 relative shrink-0',
          className
        )}
      >
        <span className="text-[18px] leading-[26px] font-semibold font-[var(--font-sans)] text-[var(--label-normal)]">
          {title ?? '마이페이지'}
        </span>
        {onSettings && (
          <button
            onClick={onSettings}
            className={cn(ICON_BTN, 'absolute right-3')}
          >
            <Settings size={22} strokeWidth={1.5} />
          </button>
        )}
      </header>
    );
  }

  return (
    <header
      className={cn(
        'h-14 box-content pt-[env(safe-area-inset-top)] bg-[var(--bg-normal)] flex items-center justify-between shrink-0',
        isDashboard ? 'px-5' : 'pl-2 pr-3',
        className
      )}
    >
      {/* 왼쪽 */}
      <div className="flex items-center gap-1 flex-1">
        {onBack ? (
          <button onClick={onBack} className={cn(ICON_BTN, 'shrink-0')}>
            <ChevronLeft size={24} strokeWidth={1.5} />
          </button>
        ) : (
          <div className={cn(ICON_BTN, 'shrink-0 pointer-events-none cursor-default')} aria-hidden="true" />
        )}

        {greeting ? (
          <div>
            <p className="text-[14px] leading-5 font-normal font-[var(--font-sans)] text-[var(--label-alternative)]">
              {greeting}
            </p>
            <p className="text-[19px] leading-[30px] font-semibold font-[var(--font-sans)] text-[var(--label-normal)]">
              {title}
            </p>
          </div>
        ) : (
          <div>
            {title && (
              <p className="text-[18px] leading-[26px] font-normal font-[var(--font-sans)] text-[var(--label-normal)]">
                {title}
              </p>
            )}
            {subtitle && (
              <p className="text-[12px] leading-4 font-normal font-[var(--font-sans)] text-[var(--label-alternative)] mt-[1px]">
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>

      {/* 오른쪽 */}
      <div className="flex items-center gap-1">
        {statusVariant && statusLabel && (
          <Badge variant={statusVariant}>{statusLabel}</Badge>
        )}
        {badge && !statusVariant && <Badge variant="green">{badge}</Badge>}

        {showBell && (
          <button className="relative flex items-center justify-center w-[42px] h-[42px] bg-[var(--bg-alternative)] rounded-[var(--radius-full)] border-none cursor-pointer text-[var(--label-normal)] transition-colors hover:bg-[var(--fill-strong)] active:bg-[var(--fill-strong)]">
            <Bell size={22} strokeWidth={1.5} />
            {hasNotification && (
              <span className="absolute top-[9px] right-[10px] w-2 h-2 rounded-full bg-[var(--primary)] border-[1.5px] border-[var(--bg-normal)]" />
            )}
          </button>
        )}

        {onSettings && (
          <button onClick={onSettings} className={ICON_BTN}>
            <Settings size={22} strokeWidth={1.5} />
          </button>
        )}

        {onClose && (
          <button onClick={onClose} className={ICON_BTN}>
            <Close size={22} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </header>
  );
}
