'use client';

import { Home, Users, Plus, Bell, User } from '@yummpi/ui';
import { cn } from '@/lib/utils';

type TabKey = 'home' | 'meetings' | 'notifications' | 'mypage';

interface MenubarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  onCreateClick: () => void;
  className?: string;
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
  className,
}: MenubarProps) {
  const TAB_BTN =
    'flex flex-col items-center gap-1 w-14 bg-transparent border-none cursor-pointer p-0';
  const TAB_LABEL =
    'text-[11px] leading-[14px] font-normal font-[var(--font-sans)]';

  return (
    <nav
      className={cn(
        'w-full bg-[var(--bg-normal)] border-t border-[var(--line-alternative)]',
        'pt-[9px] px-3 flex items-start justify-around',
        className
      )}
      style={{ paddingBottom: 'max(30px, env(safe-area-inset-bottom))' }}
    >
      {LEFT_TABS.map(({ key, Icon, label }) => {
        const isActive = activeTab === key;
        return (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={TAB_BTN}
          >
            <Icon
              size={20}
              strokeWidth={1.5}
              color={isActive ? 'var(--primary)' : 'var(--label-assistive)'}
            />
            <span
              className={cn(
                TAB_LABEL,
                isActive
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--label-assistive)]'
              )}
            >
              {label}
            </span>
          </button>
        );
      })}

      <button
        onClick={onCreateClick}
        className="flex flex-col items-center gap-1 w-11 bg-transparent border-none cursor-pointer p-0"
      >
        <div className="w-11 h-11 rounded-[14px] bg-[var(--primary)] flex items-center justify-center">
          <Plus size={24} strokeWidth={1.5} color="var(--static-white)" />
        </div>
        <span className={cn(TAB_LABEL, 'text-[var(--label-assistive)]')}>
          만들기
        </span>
      </button>

      {RIGHT_TABS.map(({ key, Icon, label }) => {
        const isActive = activeTab === key;
        return (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={TAB_BTN}
          >
            <Icon
              size={20}
              strokeWidth={1.5}
              color={isActive ? 'var(--primary)' : 'var(--label-assistive)'}
            />
            <span
              className={cn(
                TAB_LABEL,
                isActive
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--label-assistive)]'
              )}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
