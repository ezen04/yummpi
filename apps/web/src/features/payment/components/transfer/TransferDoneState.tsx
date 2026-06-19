'use client';

import { formatAmount } from '../../lib/transferMock';
import type { PaymentListItem } from '@yummpi/schemas';

type Props = {
  item: PaymentListItem;
};

export function TransferDoneState({ item }: Props) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-16 gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-[var(--status-positive)]/10 flex items-center justify-center text-3xl">
        ✅
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-base font-semibold text-[var(--label-strong)]">
          입금이 확인됐어요
        </p>
        <p className="text-sm text-[var(--label-alternative)]">
          {formatAmount(item.amount)} 정산 완료
        </p>
      </div>
    </div>
  );
}
