'use client';

import { Button } from '@yummpi/ui';
import { formatAmount } from '../../lib/transferMock';
import { updatePayment } from '../../lib/paymentApi';
import { useState } from 'react';
import type { PaymentListItem } from '@yummpi/schemas';

type Props = {
  item: PaymentListItem;
  meetingId: string;
  onReverted: () => void;
};

export function TransferPendingState({ item, meetingId, onReverted }: Props) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRevert() {
    setIsPending(true);
    setError(null);
    try {
      await updatePayment(meetingId, item.paymentId, 'MARK_PENDING');
      onReverted();
    } catch {
      setError('취소 중 오류가 발생했어요. 다시 시도해 주세요.');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center px-5 py-16 gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-[var(--status-cautionary)]/10 flex items-center justify-center text-3xl">
        ⏳
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-base font-semibold text-[var(--label-strong)]">
          주최자 확인을 기다리고 있어요
        </p>
        <p className="text-sm text-[var(--label-alternative)]">
          {formatAmount(item.amount)} 송금 신고 완료
        </p>
      </div>
      {error && (
        <p className="text-xs text-[var(--status-negative)]">{error}</p>
      )}
      {item.canCancelTransfer && (
        <Button
          variant="outline"
          size="sm"
          className="rounded-full text-xs h-8 text-[var(--label-alternative)] mt-2"
          onClick={handleRevert}
          disabled={isPending}
        >
          {isPending ? '처리 중...' : '송금 취소'}
        </Button>
      )}
    </div>
  );
}
