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
      className={cn(props.className)}
      style={{
        width: '100%',
        background: 'var(--bg-normal)',
        borderTop: '1px solid var(--line-alternative)',
        padding: '13px 20px max(30px, env(safe-area-inset-bottom))',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {hint && (
        <p
          style={{
            font: '400 12px/16px var(--font-sans)',
            color: 'var(--label-alternative)',
            textAlign: 'center',
          }}
        >
          {hint}
        </p>
      )}
      <button
        onClick={onClick}
        disabled={disabled}
        style={{
          height: 48,
          width: '100%',
          borderRadius: 'var(--radius-12)',
          background: disabled ? 'var(--fill-disable)' : 'var(--primary)',
          color: disabled ? 'var(--label-disable)' : 'var(--static-white)',
          font: '600 16px var(--font-sans)',
          border: 'none',
          cursor: disabled ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
        }}
      >
        {icon}
        {label}
      </button>
    </footer>
  );
}
