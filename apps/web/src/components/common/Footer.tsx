'use client';

import { cn } from '@/lib/utils';
import { Menubar } from './Menubar';

type TabKey = 'home' | 'meetings' | 'notifications' | 'mypage';

type FooterProps =
  | {
      variant: 'button';
      label: string;
      onClick: () => void;
      hint?: string;
      icon?: React.ReactNode;
      disabled?: boolean;
      className?: string;
    }
  | {
      variant: 'menubar';
      activeTab: TabKey;
      onTabChange: (tab: TabKey) => void;
      onCreateClick: () => void;
      className?: string;
    };

export function Footer(props: FooterProps) {
  if (props.variant === 'menubar') {
    return (
      <Menubar
        activeTab={props.activeTab}
        onTabChange={props.onTabChange}
        onCreateClick={props.onCreateClick}
      />
    );
  }

  const { label, onClick, hint, icon, disabled } = props;

  return (
    <footer
      className={cn(
        'w-full flex flex-col gap-2 bg-[var(--bg-normal)] border-t border-[var(--line-alternative)]',
        'px-5 pt-[13px] pb-[max(30px,env(safe-area-inset-bottom))]',
        props.className
      )}
    >
      {hint && (
        <p className="text-[12px] leading-4 font-normal font-[var(--font-sans)] text-[var(--label-alternative)] text-center">
          {hint}
        </p>
      )}
      <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          'w-full h-12 rounded-[var(--radius-12)] flex items-center justify-center gap-1',
          'text-[16px] font-semibold font-[var(--font-sans)] border-none',
          disabled
            ? 'bg-[var(--fill-disable)] text-[var(--label-disable)] cursor-default'
            : 'bg-[var(--primary)] text-[var(--static-white)] cursor-pointer'
        )}
      >
        {icon}
        {label}
      </button>
    </footer>
  );
}
