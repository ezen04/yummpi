'use client';

import { Button } from '@/components/common/Button';
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
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="rounded-full px-5"
          >
            다시 시도
          </Button>
        )}
      </div>
    </div>
  );
}
