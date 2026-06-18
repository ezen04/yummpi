'use client';

import * as React from 'react';

// ── TODO 카드 (주최자용 — 진행 중인 액션 안내) ──────────────────

type TodoCardType = 'location-vote' | 'adjustment' | 'transfer';

interface TodoCardProps {
  type: TodoCardType;
  onAction?: () => void;
}

const TODO_CONFIG: Record<TodoCardType, {
  icon: React.ReactNode;
  title: string;
  desc: string;
  action: string;
}> = {
  'location-vote': {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="9" r="2.5" stroke="var(--primary)" strokeWidth="1.5"/>
      </svg>
    ),
    title: '장소 투표가 진행 중이에요',
    desc: '참여자들이 투표하고 있어요. 마감 후 장소를 확정해주세요.',
    action: '투표 현황 보기',
  },
  'adjustment': {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="5" width="18" height="14" rx="2" stroke="var(--primary)" strokeWidth="1.5"/>
        <path d="M3 9h18" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M7 14h4M15 14h2" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: '정산이 진행 중이에요',
    desc: '영수증을 확인하고 항목별 정산을 완료해주세요.',
    action: '정산 확인하기',
  },
  'transfer': {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M22 2L11 13" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M22 2L15 22L11 13L2 9L22 2z" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: '송금 요청을 보냈어요',
    desc: '참여자들의 송금을 기다리고 있어요. 미송금자에게 독촉할 수 있어요.',
    action: '송금 현황 보기',
  },
};

export function TodoCard({ type, onAction }: TodoCardProps) {
  const config = TODO_CONFIG[type];

  return (
    <div
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--line-normal)',
        borderRadius: 'var(--radius-12)',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span style={{ flexShrink: 0, marginTop: 1 }}>{config.icon}</span>
        <div>
          <p style={{ font: '600 15px/22px var(--font-sans)', color: 'var(--label-normal)', margin: 0 }}>
            {config.title}
          </p>
          <p style={{ font: '400 13px/18px var(--font-sans)', color: 'var(--label-alternative)', margin: '4px 0 0' }}>
            {config.desc}
          </p>
        </div>
      </div>

      <button
        onClick={onAction}
        style={{
          height: 36,
          borderRadius: 'var(--radius-8)',
          border: '1px solid var(--primary)',
          background: 'transparent',
          font: '500 13px var(--font-sans)',
          color: 'var(--primary)',
          cursor: 'pointer',
        }}
      >
        {config.action}
      </button>
    </div>
  );
}

// ── 대기 카드 (일반 참여자용 — 진행 상황 안내) ─────────────────

type WaitingCardType = 'location-vote' | 'adjustment';

interface WaitingCardProps {
  type: WaitingCardType;
}

const WAITING_CONFIG: Record<WaitingCardType, { icon: React.ReactNode; title: string; desc: string }> = {
  'location-vote': {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="var(--label-assistive)" strokeWidth="1.5"/>
        <path d="M12 7v5l3 3" stroke="var(--label-assistive)" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: '장소 투표를 기다리고 있어요',
    desc: '주최자가 투표를 시작하면 알려드릴게요.',
  },
  'adjustment': {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="var(--label-assistive)" strokeWidth="1.5"/>
        <path d="M12 7v5l3 3" stroke="var(--label-assistive)" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: '정산을 기다리고 있어요',
    desc: '주최자가 정산을 시작하면 알려드릴게요.',
  },
};

export function WaitingCard({ type }: WaitingCardProps) {
  const config = WAITING_CONFIG[type];

  return (
    <div
      style={{
        background: 'var(--fill-normal)',
        borderRadius: 'var(--radius-12)',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}
    >
      <span style={{ flexShrink: 0, marginTop: 1 }}>{config.icon}</span>
      <div>
        <p style={{ font: '600 15px/22px var(--font-sans)', color: 'var(--label-alternative)', margin: 0 }}>
          {config.title}
        </p>
        <p style={{ font: '400 13px/18px var(--font-sans)', color: 'var(--label-assistive)', margin: '4px 0 0' }}>
          {config.desc}
        </p>
      </div>
    </div>
  );
}
