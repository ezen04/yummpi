'use client';

import { ChevronLeft, Close, Settings, Bell } from '@yummpi/ui';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Badge, type BadgeVariant } from './Badge';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  /** subtitle에 더할 클래스 (예: 상태 톤 색상) */
  subtitleClassName?: string;
  greeting?: string;
  onBack?: () => void;
  onClose?: () => void;
  onSettings?: () => void;
  showBell?: boolean;
  hasNotification?: boolean;
  /** 벨 클릭 핸들러 (showBell과 함께 사용) */
  onBell?: () => void;
  /** 우측 커스텀 액션 슬롯 (더보기 등) */
  rightActions?: ReactNode;
  /** onBack이 없을 때 좌측 정렬용 placeholder를 렌더하지 않음 (최상위 화면) */
  hideBackSpacer?: boolean;
  /** @deprecated badge 대신 statusVariant + statusLabel 사용 */
  badge?: string;
  /** title-status variant용 */
  statusVariant?: BadgeVariant;
  statusLabel?: string;
  /** mypage variant */
  isMypage?: boolean;
  className?: string;
}

// 모든 헤더 공통 컨테이너 (높이·상단 safe-area·배경)
const HEADER_BASE =
  'h-14 box-content pt-[max(env(safe-area-inset-top),12px)] bg-[var(--bg-normal)] shrink-0';
// 단일 타이틀 타이포 (font-family는 body 전역 지정 상속 — font-[var()]를 cn에 넣으면
// tailwind-merge가 font-semibold와 충돌 처리해 굵기를 떨구므로 명시하지 않는다)
const TITLE_CLS =
  'text-[18px] leading-[26px] font-semibold text-[var(--label-normal)]';

export function Header({
  title,
  subtitle,
  subtitleClassName,
  greeting,
  onBack,
  onClose,
  onSettings,
  showBell,
  hasNotification,
  onBell,
  rightActions,
  hideBackSpacer,
  badge,
  statusVariant,
  statusLabel,
  isMypage,
  className,
}: HeaderProps) {
  const isDashboard = !!greeting;

  const ICON_BTN =
    'flex items-center justify-center w-10 h-10 bg-transparent border-none cursor-pointer text-[var(--label-normal)] rounded-[var(--radius-full)] transition-colors hover:bg-[var(--fill-normal)] active:bg-[var(--fill-strong)]';

  // mypage: 좌측 타이틀 + 오른쪽 설정 아이콘 (다른 헤더와 좌측 정렬 통일)
  if (isMypage) {
    return (
      <header
        className={cn(
          HEADER_BASE,
          'flex items-center justify-between px-5',
          className
        )}
      >
        <span className={TITLE_CLS}>{title ?? '마이페이지'}</span>
        {onSettings && (
          <button onClick={onSettings} className={cn(ICON_BTN, '-mr-2')}>
            <Settings size={22} strokeWidth={1.5} />
          </button>
        )}
      </header>
    );
  }

  return (
    <header
      className={cn(
        HEADER_BASE,
        'flex items-center justify-between px-5',
        className
      )}
    >
      {/* 왼쪽 */}
      <div className="flex items-center gap-1 flex-1 min-w-0">
        {onBack ? (
          <button onClick={onBack} className={cn(ICON_BTN, 'shrink-0 -ml-2')}>
            <ChevronLeft size={24} strokeWidth={1.5} />
          </button>
        ) : isDashboard || hideBackSpacer ? null : (
          <div
            className={cn(
              ICON_BTN,
              'shrink-0 -ml-2 pointer-events-none cursor-default'
            )}
            aria-hidden="true"
          />
        )}

        {greeting ? (
          <div className="min-w-0">
            <p className="text-[14px] leading-5 font-normal font-[var(--font-sans)] text-[var(--label-alternative)]">
              {greeting}
            </p>
            <p className={cn(TITLE_CLS, 'truncate')}>{title}</p>
          </div>
        ) : (
          <div className="min-w-0">
            {title && <p className={cn(TITLE_CLS, 'truncate')}>{title}</p>}
            {subtitle && (
              <p
                className={cn(
                  'text-[12px] leading-4 font-normal font-[var(--font-sans)] text-[var(--label-alternative)] mt-[1px]',
                  subtitleClassName
                )}
              >
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>

      {/* 오른쪽 */}
      <div className="flex items-center gap-1 shrink-0">
        {statusVariant && statusLabel && (
          <Badge variant={statusVariant}>{statusLabel}</Badge>
        )}
        {badge && !statusVariant && <Badge variant="green">{badge}</Badge>}

        {showBell && (
          <button
            onClick={onBell}
            aria-label="알림"
            className="relative flex items-center justify-center w-[42px] h-[42px] -mr-1 bg-[var(--bg-alternative)] rounded-[var(--radius-full)] border-none cursor-pointer text-[var(--label-normal)] transition-colors hover:bg-[var(--fill-strong)] active:bg-[var(--fill-strong)]"
          >
            <Bell size={22} strokeWidth={1.5} />
            {hasNotification && (
              <span className="absolute top-[9px] right-[10px] w-2 h-2 rounded-full bg-[var(--primary)] border-[1.5px] border-[var(--bg-normal)]" />
            )}
          </button>
        )}

        {onSettings && (
          <button onClick={onSettings} className={cn(ICON_BTN, '-mr-2')}>
            <Settings size={22} strokeWidth={1.5} />
          </button>
        )}

        {onClose && (
          <button onClick={onClose} className={cn(ICON_BTN, '-mr-2')}>
            <Close size={22} strokeWidth={1.5} />
          </button>
        )}

        {rightActions}
      </div>
    </header>
  );
}
