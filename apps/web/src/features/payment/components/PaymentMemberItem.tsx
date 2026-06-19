'use client';

import { useState } from 'react';
import { formatAmount } from '../lib/transferMock';
import { Confirmbox } from '@/components/common/Confirmbox';
import type { PaymentListItem, PaymentAction } from '@yummpi/schemas';

type Props = {
  item: PaymentListItem;
  onAction?: (paymentId: string, action: PaymentAction) => void;
};

const STATUS_BADGE: Record<
  string,
  { label: string; className: string } | null
> = {
  PAID: {
    label: '완료',
    className: 'text-[var(--status-positive)] bg-[var(--status-positive)]/10',
  },
  EXEMPT: {
    label: '면제',
    className:
      'text-[var(--label-alternative)] bg-[var(--bg-alternative)]',
  },
  TRANSFER_REPORTED: {
    label: '송금 신고',
    className:
      'text-[var(--status-cautionary)] bg-[var(--status-cautionary)]/10',
  },
  PENDING: null,
};

export function PaymentMemberItem({ item, onAction }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const badge = STATUS_BADGE[item.status] ?? null;
  const hasAction =
    item.canMarkPaid || item.canMarkPending || item.canMarkExempt;

  return (
    <>
      <div className="flex items-center gap-3 px-5 h-16">
        {/* 아바타 */}
        <div className="w-6 h-6 rounded-full bg-[var(--bg-alternative)] flex items-center justify-center text-xs font-medium text-[var(--label-neutral)] shrink-0">
          {item.displayName[0]}
        </div>

        {/* 이름 + 금액 */}
        <div className="flex-1 flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-[var(--label-strong)] truncate">
              {item.displayName}
            </span>
            {badge && (
              <span
                className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${badge.className}`}
              >
                {badge.label}
              </span>
            )}
          </div>
          <span className="text-xs text-[var(--label-alternative)]">
            {formatAmount(item.amount)}
          </span>
        </div>

        {/* 호스트 액션 버튼 */}
        {hasAction && onAction && (
          <div className="shrink-0">
            {item.canMarkPaid && (
              <button
                className="rounded-full text-xs h-8 px-3 border border-[var(--line-normal)] bg-[var(--bg-normal)] text-[var(--label-normal)] cursor-pointer font-medium"
                onClick={() => setConfirmOpen(true)}
              >
                송금 확인
              </button>
            )}
            {item.canMarkPending && (
              <button
                className="rounded-full text-xs h-8 px-3 border border-[var(--line-normal)] bg-[var(--bg-normal)] text-[var(--label-alternative)] cursor-pointer font-medium"
                onClick={() => onAction(item.paymentId, 'MARK_PENDING')}
              >
                되돌리기
              </button>
            )}
            {item.canMarkExempt && (
              <button
                className="rounded-full text-xs h-8 px-3 border border-[var(--line-normal)] bg-[var(--bg-normal)] text-[var(--label-alternative)] cursor-pointer font-medium"
                onClick={() => onAction(item.paymentId, 'MARK_EXEMPT')}
              >
                면제
              </button>
            )}
          </div>
        )}
      </div>

      {/* 송금 확인 다이얼로그 */}
      <Confirmbox
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          onAction?.(item.paymentId, 'MARK_PAID');
          setConfirmOpen(false);
        }}
        title={`${formatAmount(item.amount)}을 정말 받으셨나요?`}
        body="확인하면 취소할 수 없어요."
        cancelLabel="아니요"
        confirmLabel="송금 확인"
      />
    </>
  );
}
