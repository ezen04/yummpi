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
      className={cn(className)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '13px 21px',
        background: 'var(--bg-normal)',
        borderBottom: '1px solid var(--line-neutral)',
        width: '100%',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {/* 아이콘 */}
      <span style={{ color: iconColor, flexShrink: 0, display: 'flex' }}>
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

      {/* 텍스트 */}
      <div
        style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}
      >
        <span
          style={{
            font: '400 15px/22px var(--font-sans)',
            color: 'var(--label-normal)',
          }}
        >
          {title}
        </span>
        {body && (
          <span
            style={{
              font: '400 12px/16px var(--font-sans)',
              color: 'var(--label-alternative)',
            }}
          >
            {body}
          </span>
        )}
      </div>

      {/* 오른쪽 화살표 */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        style={{ flexShrink: 0 }}
      >
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
