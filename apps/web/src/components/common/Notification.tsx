'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Bell, ChevronRight } from '@yummpi/ui';

interface NotificationProps {
  variant: 'unread' | 'read';
  title: string;
  body?: string;
  icon?: React.ReactNode;
  /** 'lucide' (기본) = Bell 아이콘, 'filled' = /icons/notification_*.png */
  iconStyle?: 'lucide' | 'filled';
  onClick?: () => void;
  className?: string;
}

export function Notification({
  variant,
  title,
  body,
  icon,
  iconStyle = 'lucide',
  onClick,
  className,
}: NotificationProps) {
  const isUnread = variant === 'unread';
  const iconColor = isUnread ? 'var(--primary)' : 'var(--label-assistive)';

  const defaultIcon =
    iconStyle === 'filled' ? (
      <Image
        src={
          isUnread
            ? '/icons/notification_active.png'
            : '/icons/notification_muted.png'
        }
        alt=""
        width={24}
        height={24}
      />
    ) : (
      <Bell size={24} strokeWidth={1.5} color="currentColor" />
    );

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-4 px-[21px] py-[13px]',
        'w-full bg-[var(--bg-normal)] border-b border-[var(--line-neutral)]',
        onClick
          ? 'cursor-pointer transition-colors hover:bg-[var(--fill-normal)] active:bg-[var(--fill-strong)]'
          : 'cursor-default',
        className
      )}
    >
      <span
        className="shrink-0 flex"
        style={iconStyle === 'lucide' ? { color: iconColor } : undefined}
      >
        {icon ?? defaultIcon}
      </span>

      <div className="flex-1 flex flex-col gap-[3px]">
        <span className="text-[15px] leading-[22px] font-normal font-[var(--font-sans)] text-[var(--label-normal)]">
          {title}
        </span>
        {body && (
          <span className="text-[12px] leading-4 font-normal font-[var(--font-sans)] text-[var(--label-alternative)]">
            {body}
          </span>
        )}
      </div>

      <ChevronRight
        size={20}
        strokeWidth={1.5}
        color="var(--label-assistive)"
        className="shrink-0"
      />
    </div>
  );
}
