'use client';

import { useState } from 'react';
import { formatAmount } from '../../utils/transferMock';
import { PaymentConfirmbox } from '../shell/PaymentConfirmbox';
import '../payment-montage.css';
import type { PaymentListItem, PaymentAction } from '@yummpi/schemas';

type Props = {
  item: PaymentListItem;
  viewerRole: 'HOST' | 'MEMBER';
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

export function PaymentMemberItem({ item, viewerRole, onAction }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const badge = STATUS_BADGE[item.status] ?? null;
  const isHostSelf = item.isMine && viewerRole === 'HOST';

  /* C-6: 독촉 가능 여부 — remindCooldownUntil 기준 */
  const canRemind =
    item.status === 'PENDING' &&
    !item.isMine &&
    !item.isGuest &&
    item.remindCooldownUntil === null;
  const isRemindCooldown =
    item.status === 'PENDING' &&
    !item.isMine &&
    !item.isGuest &&
    item.remindCooldownUntil !== null;

  return (
    <>
      <div className="flex items-center gap-3 px-5 h-[68px]">
        {/* 아바타 — C-2: 44px */}
        <div className="w-11 h-11 rounded-full bg-[var(--bg-alternative)] flex items-center justify-center text-sm font-semibold text-[var(--label-neutral)] shrink-0">
          {item.displayName[0]}
        </div>

        {/* 이름 + 금액 */}
        <div className="flex-1 flex flex-col justify-center min-w-0 gap-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-[var(--label-strong)] truncate">
              {item.displayName}
            </span>
            {/* C-3: 게스트 뱃지 업그레이드 */}
            {item.isGuest && (
              <span className="shrink-0 text-[12px] font-semibold px-2 py-0.5 rounded-full bg-[var(--fill-normal)] text-[var(--label-alternative)]">
                게스트
              </span>
            )}
            {isHostSelf && (
              <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                주최자
              </span>
            )}
            {item.isMine && (
              <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[var(--fill-normal)] text-[var(--label-neutral)]">
                나
              </span>
            )}
          </div>
          <span className="text-xs text-[var(--label-alternative)]">
            {isHostSelf ? `선결제 · ${formatAmount(item.amount)}` : formatAmount(item.amount)}
          </span>
        </div>

        {/* 오른쪽: 배지 또는 액션 버튼 — C-5: h-10 (40px) */}
        <div className="shrink-0 flex items-center gap-1.5">
          {badge && (
            <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${badge.className}`}>
              {badge.label}
            </span>
          )}

          {/* EXEMPT → 면제 취소 (배지와 함께 노출) */}
          {item.status === 'EXEMPT' && item.canMarkPending && onAction && (
            <button
              className="rounded-full text-[15px] h-10 px-[18px] border border-[var(--line-normal)] bg-[var(--bg-normal)] text-[var(--label-alternative)] cursor-pointer font-medium whitespace-nowrap"
              onClick={() => onAction(item.paymentId, 'MARK_PENDING')}
            >
              면제 취소
            </button>
          )}

          {!badge && onAction && (
            <>
              {/* TRANSFER_REPORTED → 완료 확인 */}
              {item.canMarkPaid && (
                <button
                  className="rounded-full text-[15px] h-10 px-[18px] bg-[var(--primary)] text-[var(--static-white)] border-none cursor-pointer font-semibold whitespace-nowrap"
                  onClick={() => setConfirmOpen(true)}
                >
                  완료 확인
                </button>
              )}

              {/* PENDING → 독촉 (C-6) */}
              {canRemind && (
                <button
                  className="rounded-full text-[15px] h-10 px-[18px] border border-[var(--primary-border)] bg-transparent text-[var(--primary)] cursor-pointer font-semibold whitespace-nowrap"
                  onClick={() => onAction(item.paymentId, 'REMIND')}
                >
                  독촉
                </button>
              )}
              {isRemindCooldown && (
                <button
                  disabled
                  className="rounded-full text-[13px] h-10 px-[14px] bg-[var(--fill-normal)] text-[var(--label-assistive)] border-none cursor-default font-semibold whitespace-nowrap"
                >
                  재독촉 대기 중
                </button>
              )}

              {/* PAID → 되돌리기 */}
              {item.canMarkPending && (
                <button
                  className="rounded-full text-[15px] h-10 px-[18px] border border-[var(--line-normal)] bg-[var(--bg-normal)] text-[var(--label-alternative)] cursor-pointer font-medium whitespace-nowrap"
                  onClick={() => onAction(item.paymentId, 'MARK_PENDING')}
                >
                  되돌리기
                </button>
              )}

              {/* PENDING → 면제 */}
              {item.canMarkExempt && (
                <button
                  className="rounded-full text-[15px] h-10 px-[18px] border border-[var(--line-normal)] bg-[var(--bg-normal)] text-[var(--label-alternative)] cursor-pointer font-medium whitespace-nowrap"
                  onClick={() => onAction(item.paymentId, 'MARK_EXEMPT')}
                >
                  면제
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <PaymentConfirmbox
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          onAction?.(item.paymentId, 'MARK_PAID');
          setConfirmOpen(false);
        }}
        cancelLabel="아니요"
        confirmLabel="송금 확인"
      >
        <p className="mtg-body2 text-[var(--label-alternative)]">
          {item.displayName}님의 금액
        </p>
        <p className="text-[30px] font-bold tracking-[-0.5px] mt-1.5 mb-1 [font-variant-numeric:tabular-nums]">
          {`'${formatAmount(item.amount)}'`}
        </p>
        <p className="mtg-body2 text-[var(--label-alternative)]">
          입금이 확인되었나요?
        </p>
      </PaymentConfirmbox>
    </>
  );
}
