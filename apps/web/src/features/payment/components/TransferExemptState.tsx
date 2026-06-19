'use client';

import type { PaymentListItem } from '@yummpi/schemas';

type Props = {
  item: PaymentListItem;
};

export function TransferExemptState({ item }: Props) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-16 gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-[var(--bg-alternative)] flex items-center justify-center text-3xl">
        🎁
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-base font-semibold text-[var(--label-strong)]">
          면제 처리됐어요
        </p>
        <p className="text-sm text-[var(--label-alternative)]">
          {item.displayName}님은 이번 정산에서 제외됐어요
        </p>
      </div>
    </div>
  );
}
