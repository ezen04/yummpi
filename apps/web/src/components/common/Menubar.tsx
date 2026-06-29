'use client';

import Image from 'next/image';
import { Plus } from '@yummpi/ui';
import { cn } from '@/lib/utils';

type TabKey = 'home' | 'meetings' | 'notifications' | 'mypage';

interface TabConfig {
  key: TabKey;
  activeIcon: string;
  mutedIcon: string;
  label: string;
}

interface MenubarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  onCreateClick: () => void;
  notificationsBadge?: boolean;
  className?: string;
}

const LEFT_TABS: TabConfig[] = [
  {
    key: 'home',
    activeIcon: '/icons/home_active.png',
    mutedIcon: '/icons/home_muted.png',
    label: '홈',
  },
  {
    key: 'meetings',
    activeIcon: '/icons/people_active.png',
    mutedIcon: '/icons/people_muted.png',
    label: '모임',
  },
];

const RIGHT_TABS: TabConfig[] = [
  {
    key: 'notifications',
    activeIcon: '/icons/notification_active.png',
    mutedIcon: '/icons/notification_muted.png',
    label: '알림',
  },
  {
    key: 'mypage',
    activeIcon: '/icons/mypage_active.png',
    mutedIcon: '/icons/mypage_muted.png',
    label: '마이',
  },
];

export function Menubar({
  activeTab,
  onTabChange,
  onCreateClick,
  notificationsBadge,
  className,
}: MenubarProps) {
  const TAB_BTN =
    'flex flex-col items-center gap-1 w-14 bg-transparent border-none cursor-pointer p-0 transition-opacity hover:opacity-70 active:opacity-50';
  const TAB_LABEL =
    'text-[11px] leading-[14px] font-normal font-[var(--font-sans)]';

  const renderTab = (tab: TabConfig) => {
    const isActive = activeTab === tab.key;
    return (
      <button
        key={tab.key}
        onClick={() => onTabChange(tab.key)}
        className={TAB_BTN}
      >
        <span className="relative">
          <Image
            src={isActive ? tab.activeIcon : tab.mutedIcon}
            alt=""
            width={20}
            height={20}
          />
          {tab.key === 'notifications' && notificationsBadge && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[var(--primary)] border border-[var(--bg-normal)]" />
          )}
        </span>
        <span
          className={cn(
            TAB_LABEL,
            isActive ? 'text-[var(--primary)]' : 'text-[var(--label-assistive)]'
          )}
        >
          {tab.label}
        </span>
      </button>
    );
  };

  return (
    <nav
      className={cn(
        'w-full bg-[var(--bg-normal)] border-t border-[var(--line-alternative)]',
        'pt-[9px] pb-[max(30px,env(safe-area-inset-bottom))] px-3 flex items-start justify-around',
        className
      )}
    >
      {LEFT_TABS.map(renderTab)}

      <button
        onClick={onCreateClick}
        className="flex flex-col items-center gap-1 w-11 bg-transparent border-none cursor-pointer p-0 transition-opacity hover:opacity-70 active:opacity-50"
      >
        <div className="w-11 h-11 rounded-[14px] bg-[var(--primary)] flex items-center justify-center">
          <Plus size={24} strokeWidth={1.5} color="var(--static-white)" />
        </div>
        <span className={cn(TAB_LABEL, 'text-[var(--label-assistive)]')}>
          만들기
        </span>
      </button>

      {RIGHT_TABS.map(renderTab)}
    </nav>
  );
}
