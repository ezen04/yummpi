'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { MapPin, CreditCard, Send, Clock } from '@yummpi/ui';

// ── TODO 카드 (주최자용 — 진행 중인 액션 안내) ──────────────────

type TodoCardType = 'location-vote' | 'adjustment' | 'transfer';

interface TodoCardProps {
  type: TodoCardType;
  onAction?: () => void;
  className?: string;
}

const TODO_CONFIG: Record<
  TodoCardType,
  {
    icon: React.ReactNode;
    title: string;
    desc: string;
    action: string;
  }
> = {
  'location-vote': {
    icon: <MapPin size={24} strokeWidth={1.5} color="var(--primary)" />,
    title: '장소 투표가 진행 중이에요',
    desc: '참여자들이 투표하고 있어요. 마감 후 장소를 확정해주세요.',
    action: '투표 현황 보기',
  },
  adjustment: {
    icon: <CreditCard size={24} strokeWidth={1.5} color="var(--primary)" />,
    title: '정산이 진행 중이에요',
    desc: '영수증을 확인하고 항목별 정산을 완료해주세요.',
    action: '정산 확인하기',
  },
  transfer: {
    icon: <Send size={24} strokeWidth={1.5} color="var(--primary)" />,
    title: '송금 요청을 보냈어요',
    desc: '참여자들의 송금을 기다리고 있어요. 미송금자에게 독촉할 수 있어요.',
    action: '송금 현황 보기',
  },
};

export function TodoCard({ type, onAction, className }: TodoCardProps) {
  const config = TODO_CONFIG[type];

  return (
    <div
      className={cn(
        'flex flex-col gap-3 bg-[var(--bg-elevated)] border border-[var(--line-normal)]',
        'rounded-[var(--radius-12)] px-5 py-4',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <span className="shrink-0 mt-[1px]">{config.icon}</span>
        <div>
          <p className="text-[15px] leading-[22px] font-semibold font-[var(--font-sans)] text-[var(--label-normal)] m-0">
            {config.title}
          </p>
          <p className="text-[13px] leading-[18px] font-normal font-[var(--font-sans)] text-[var(--label-alternative)] mt-1 mb-0">
            {config.desc}
          </p>
        </div>
      </div>

      <button
        onClick={onAction}
        className="h-9 rounded-[var(--radius-8)] border border-[var(--primary)] bg-transparent text-[13px] font-medium font-[var(--font-sans)] text-[var(--primary)] cursor-pointer transition-colors hover:bg-[var(--primary-tint)] active:bg-[var(--primary-tint)]"
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
  className?: string;
}

const WAITING_CONFIG: Record<
  WaitingCardType,
  { icon: React.ReactNode; title: string; desc: string }
> = {
  'location-vote': {
    icon: <Clock size={24} strokeWidth={1.5} color="var(--label-assistive)" />,
    title: '장소 투표를 기다리고 있어요',
    desc: '주최자가 투표를 시작하면 알려드릴게요.',
  },
  adjustment: {
    icon: <Clock size={24} strokeWidth={1.5} color="var(--label-assistive)" />,
    title: '정산을 기다리고 있어요',
    desc: '주최자가 정산을 시작하면 알려드릴게요.',
  },
};

export function WaitingCard({ type, className }: WaitingCardProps) {
  const config = WAITING_CONFIG[type];

  return (
    <div
      className={cn(
        'flex items-start gap-3 bg-[var(--fill-normal)] rounded-[var(--radius-12)] px-5 py-4',
        className
      )}
    >
      <span className="shrink-0 mt-[1px]">{config.icon}</span>
      <div>
        <p className="text-[15px] leading-[22px] font-semibold font-[var(--font-sans)] text-[var(--label-alternative)] m-0">
          {config.title}
        </p>
        <p className="text-[13px] leading-[18px] font-normal font-[var(--font-sans)] text-[var(--label-assistive)] mt-1 mb-0">
          {config.desc}
        </p>
      </div>
    </div>
  );
}
