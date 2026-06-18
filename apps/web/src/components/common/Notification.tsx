'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface NotificationProps {
  variant: 'unread' | 'read';
  title: string;
  body?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function Notification({
  variant,
  title,
  body,
  icon,
  onClick,
  className,
}: NotificationProps) {
  const isUnread = variant === 'unread';
  const iconColor = isUnread ? 'var(--primary)' : 'var(--label-assistive)';

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-4 px-[21px] py-[13px]',
        'w-full bg-[var(--bg-normal)] border-b border-[var(--line-neutral)]',
        onClick ? 'cursor-pointer' : 'cursor-default',
        className,
      )}
    >
      <span
        className="shrink-0 flex"
        style={{ color: iconColor }}
      >
        {icon ?? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M13.73 21a2 2 0 0 1-3.46 0"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
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

      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0">
        <path
          d="M7.5 5L12.5 10L7.5 15"
          stroke="var(--label-assistive)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
