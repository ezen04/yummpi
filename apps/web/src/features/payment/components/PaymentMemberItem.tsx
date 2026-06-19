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
    className:
      'text-[var(--status-positive)] border border-[var(--status-positive)]',
  },
  EXEMPT: {
    label: '면제',
    className:
      'text-[var(--label-alternative)] border border-[var(--line-normal)]',
  },
  TRANSFER_REPORTED: null,
  PENDING: null,
};

export function PaymentMemberItem({ item, onAction }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const badge = STATUS_BADGE[item.status] ?? null;

  return (
    <>
      <div className="flex items-center gap-3 px-5 h-16">
        {/* 아바타 */}
        <div className="w-9 h-9 rounded-full bg-[var(--bg-alternative)] flex items-center justify-center text-sm font-semibold text-[var(--label-neutral)] shrink-0">
          {item.displayName[0]}
        </div>

        {/* 이름 + 금액 */}
        <div className="flex-1 flex flex-col justify-center min-w-0 gap-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-[var(--label-strong)] truncate">
              {item.displayName}
            </span>
            {item.isGuest && (
              <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[var(--bg-alternative)] text-[var(--label-assistive)]">
                게스트
              </span>
            )}
          </div>
          <span className="text-xs text-[var(--label-alternative)]">
            {formatAmount(item.amount)}
          </span>
        </div>

        {/* 오른쪽: 배지 또는 액션 버튼 */}
        <div className="shrink-0">
          {/* PAID / EXEMPT → 완료/면제 배지 */}
          {badge && (
            <span
              className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${badge.className}`}
            >
              {badge.label}
            </span>
          )}

          {/* 액션 버튼 (배지 없는 경우만) */}
          {!badge && onAction && (
            <>
              {/* TRANSFER_REPORTED → 완료 확인 */}
              {item.canMarkPaid && (
                <button
                  className="rounded-full text-xs h-8 px-3 bg-[var(--primary)] text-[var(--static-white)] border-none cursor-pointer font-semibold"
                  onClick={() => setConfirmOpen(true)}
                >
                  완료 확인
                </button>
              )}

              {/* PENDING → 독촉 / 쿨다운 */}
              {item.status === 'PENDING' && !item.isMine && (() => {
                const cooldownUntil = item.remindCooldownUntil ? new Date(item.remindCooldownUntil) : null;
                const inCooldown = cooldownUntil !== null && cooldownUntil > new Date();
                if (inCooldown) {
                  const remainingHours = Math.ceil((cooldownUntil.getTime() - Date.now()) / (1000 * 60 * 60));
                  return (
                    <button
                      disabled
                      className="rounded-full text-xs h-8 px-3 border border-[var(--line-normal)] bg-[var(--bg-normal)] text-[var(--label-assistive)] cursor-default font-medium whitespace-nowrap"
                    >
                      {remainingHours}시간 후 재독촉 가능
                    </button>
                  );
                }
                return (
                  <button
                    className="rounded-full text-xs h-8 px-3 border border-[var(--line-normal)] bg-[var(--bg-normal)] text-[var(--label-alternative)] hover:bg-[var(--primary)] hover:text-[var(--static-white)] hover:border-[var(--primary)] transition-colors cursor-pointer font-medium"
                    onClick={() => {
                      /* Phase 5: POST /payments/{id}/remind */
                    }}
                  >
                    독촉
                  </button>
                );
              })()}

              {/* PAID → 되돌리기 */}
              {item.canMarkPending && (
                <button
                  className="rounded-full text-xs h-8 px-3 border border-[var(--line-normal)] bg-[var(--bg-normal)] text-[var(--label-alternative)] cursor-pointer font-medium"
                  onClick={() => onAction(item.paymentId, 'MARK_PENDING')}
                >
                  되돌리기
                </button>
              )}

              {/* PENDING → 면제 */}
              {item.canMarkExempt && (
                <button
                  className="rounded-full text-xs h-8 px-3 border border-[var(--line-normal)] bg-[var(--bg-normal)] text-[var(--label-alternative)] cursor-pointer font-medium"
                  onClick={() => onAction(item.paymentId, 'MARK_EXEMPT')}
                >
                  면제
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* 송금 확인 다이얼로그 */}
      <Confirmbox
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          onAction?.(item.paymentId, 'MARK_PAID');
          setConfirmOpen(false);
        }}
        title={`${item.displayName}님의 금액 '${formatAmount(item.amount)}' 입금이 확인되나요?`}
        cancelLabel="아니요"
        confirmLabel="송금 확인"
      />
    </>
  );
}
