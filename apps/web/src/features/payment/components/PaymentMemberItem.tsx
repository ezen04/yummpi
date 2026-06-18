'use client';

import { Button } from '@yummpi/ui';
import { formatAmount } from '../lib/transferMock';
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
  const badge = STATUS_BADGE[item.status] ?? null;
  const hasAction =
    item.canMarkPaid || item.canMarkPending || item.canMarkExempt;

  return (
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
            <Button
              variant="outline"
              size="sm"
              className="rounded-full text-xs h-8"
              onClick={() => onAction(item.paymentId, 'MARK_PAID')}
            >
              완료 확인
            </Button>
          )}
          {item.canMarkPending && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full text-xs h-8 text-[var(--label-alternative)]"
              onClick={() => onAction(item.paymentId, 'MARK_PENDING')}
            >
              되돌리기
            </Button>
          )}
          {item.canMarkExempt && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full text-xs h-8 text-[var(--label-alternative)]"
              onClick={() => onAction(item.paymentId, 'MARK_EXEMPT')}
            >
              면제
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
