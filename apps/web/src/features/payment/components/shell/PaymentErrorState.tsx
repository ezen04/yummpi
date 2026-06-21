'use client';

import { PaymentHeaderWrapper } from './PaymentHeaderWrapper';

type Props = {
  message?: string;
  onRetry?: () => void;
};

export function PaymentErrorState({
  message = '송금 현황을 불러오지 못했어요',
  onRetry,
}: Props) {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-[var(--bg-normal)]">
      <PaymentHeaderWrapper />

      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-5 text-center">
        <p className="text-base font-medium text-gray-800">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-5 py-2 rounded-full text-sm font-medium border border-gray-300 text-gray-600 active:bg-gray-50"
          >
            다시 시도
          </button>
        )}
      </div>
    </div>
  );
}
