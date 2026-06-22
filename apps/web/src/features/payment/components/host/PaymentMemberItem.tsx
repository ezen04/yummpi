'use client';

import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { formatAmount, formatCooldownUntil } from '../../utils/transferMock';
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
  const isHost = viewerRole === 'HOST';
  const isHostSelf = item.isMine && isHost;
  const isCooldown =
    item.remindCooldownUntil !== null &&
    new Date(item.remindCooldownUntil) > new Date();

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
            {isHostSelf
              ? `선결제 · ${formatAmount(item.amount)}`
              : formatAmount(item.amount)}
          </span>
        </div>

        {/* 오른쪽: 배지 또는 액션 버튼 — C-5: h-10 (40px) */}
        <div className="shrink-0 flex items-center gap-1.5">
          {badge && (
            <span
              className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${badge.className}`}
            >
              {badge.label}
            </span>
          )}

          {/* EXEMPT → 면제 취소 (배지와 함께 노출) */}
          {item.status === 'EXEMPT' && item.canMarkPending && onAction && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAction(item.paymentId, 'MARK_PENDING')}
              className="rounded-full h-10 px-[18px] text-[15px] font-medium text-[var(--label-alternative)] whitespace-nowrap"
            >
              면제 취소
            </Button>
          )}

          {!badge && onAction && (
            <>
              {/* TRANSFER_REPORTED → 완료 확인 */}
              {item.canMarkPaid && (
                <Button
                  variant="basic"
                  size="sm"
                  onClick={() => setConfirmOpen(true)}
                  className="rounded-full h-10 px-[18px] text-[15px] whitespace-nowrap"
                >
                  완료 확인
                </Button>
              )}

              {/* PAID → 되돌리기 */}
              {item.canMarkPending && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAction(item.paymentId, 'MARK_PENDING')}
                  className="rounded-full h-10 px-[18px] text-[15px] font-medium text-[var(--label-alternative)] whitespace-nowrap"
                >
                  되돌리기
                </Button>
              )}

              {/* PENDING → 독촉 (회원만, 쿨다운 중 비활성) */}
              {isHost &&
                !isHostSelf &&
                item.status === 'PENDING' &&
                !item.isGuest && (
                  <div className="flex flex-col items-end gap-0.5">
                    <Button
                      variant="basic"
                      size="sm"
                      onClick={() => onAction(item.paymentId, 'REMIND')}
                      disabled={isCooldown}
                      className="rounded-full h-10 px-[18px] text-[15px] whitespace-nowrap"
                    >
                      독촉
                    </Button>
                    {isCooldown && item.remindCooldownUntil && (
                      <span className="text-[11px] text-[var(--label-alternative)] whitespace-nowrap">
                        {formatCooldownUntil(item.remindCooldownUntil)} 이후
                        가능
                      </span>
                    )}
                  </div>
                )}

              {/* PENDING → 면제 */}
              {item.canMarkExempt && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAction(item.paymentId, 'MARK_EXEMPT')}
                  className="rounded-full h-10 px-[18px] text-[15px] font-medium text-[var(--label-alternative)] whitespace-nowrap"
                >
                  면제
                </Button>
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
