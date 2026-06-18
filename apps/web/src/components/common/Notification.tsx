'use client';

import * as React from 'react';

interface NotificationProps {
  variant: 'unread' | 'read';
  title: string;
  body: string;
  time: string;
  icon?: React.ReactNode;
}

export function Notification({ variant, title, body, time, icon }: NotificationProps) {
  const isUnread = variant === 'unread';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '14px 16px',
        background: isUnread ? 'var(--bg-normal)' : 'var(--bg-alternative)',
      }}
    >
      {/* 읽음 여부 도트 */}
      <div style={{ width: 6, flexShrink: 0, paddingTop: 6, display: 'flex', justifyContent: 'center' }}>
        {isUnread && (
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--primary)',
              display: 'block',
            }}
          />
        )}
      </div>

      {/* 아이콘 */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'var(--fill-normal)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: 'var(--label-alternative)',
        }}
      >
        {icon}
      </div>

      {/* 텍스트 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            font: '500 15px/22px var(--font-sans)',
            color: 'var(--label-normal)',
            margin: 0,
          }}
        >
          {title}
        </p>
        <p
          style={{
            font: '400 13px/18px var(--font-sans)',
            color: 'var(--label-alternative)',
            margin: '2px 0 0',
          }}
        >
          {body}
        </p>
        <p
          style={{
            font: '400 12px/16px var(--font-sans)',
            color: 'var(--label-assistive)',
            margin: '4px 0 0',
          }}
        >
          {time}
        </p>
      </div>
    </div>
  );
}
