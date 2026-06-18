'use client';

import { Home, Users, Plus, Bell, User } from '@yummpi/ui';

type TabKey = 'home' | 'meetings' | 'notifications' | 'mypage';

interface MenubarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  onCreateClick: () => void;
}

const LEFT_TABS = [
  { key: 'home' as TabKey, Icon: Home, label: '홈' },
  { key: 'meetings' as TabKey, Icon: Users, label: '모임' },
];

const RIGHT_TABS = [
  { key: 'notifications' as TabKey, Icon: Bell, label: '알림' },
  { key: 'mypage' as TabKey, Icon: User, label: '마이' },
];

export function Menubar({
  activeTab,
  onTabChange,
  onCreateClick,
}: MenubarProps) {
  return (
    <nav
      style={{
        width: '100%',
        background: 'var(--bg-normal)',
        borderTop: '1px solid var(--line-alternative)',
        paddingTop: 9,
        paddingBottom: 'max(30px, env(safe-area-inset-bottom))',
        paddingLeft: 12,
        paddingRight: 12,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-around',
      }}
    >
      {LEFT_TABS.map(({ key, Icon, label }) => {
        const isActive = activeTab === key;
        return (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              width: 56,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <Icon
              size={20}
              strokeWidth={1.5}
              color={isActive ? 'var(--primary)' : 'var(--label-assistive)'}
            />
            <span
              style={{
                font: '400 11px/14px var(--font-sans)',
                color: isActive ? 'var(--primary)' : 'var(--label-assistive)',
              }}
            >
              {label}
            </span>
          </button>
        );
      })}

      {/* 중앙 FAB */}
      <button
        onClick={onCreateClick}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          width: 44,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Plus size={24} strokeWidth={1.5} color="var(--static-white)" />
        </div>
        <span
          style={{
            font: '400 11px/14px var(--font-sans)',
            color: 'var(--label-assistive)',
          }}
        >
          만들기
        </span>
      </button>

      {RIGHT_TABS.map(({ key, Icon, label }) => {
        const isActive = activeTab === key;
        return (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              width: 56,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <Icon
              size={20}
              strokeWidth={1.5}
              color={isActive ? 'var(--primary)' : 'var(--label-assistive)'}
            />
            <span
              style={{
                font: '400 11px/14px var(--font-sans)',
                color: isActive ? 'var(--primary)' : 'var(--label-assistive)',
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
