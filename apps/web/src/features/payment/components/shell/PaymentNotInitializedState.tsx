'use client';

import { Button } from '@/components/common/Button';
import { PaymentHeaderWrapper } from './PaymentHeaderWrapper';

type Props = {
  viewerRole: 'HOST' | 'MEMBER';
  onInitialize: () => void;
  isInitializing?: boolean;
  errorMessage?: string;
};

export function PaymentNotInitializedState({
  viewerRole,
  onInitialize,
  isInitializing = false,
  errorMessage,
}: Props) {
  const isHost = viewerRole === 'HOST';

  const message = isHost
    ? '아직 멤버들에게 송금을 요청하지 않았어요'
    : '호스트가 아직 송금 정보를 준비하지 않았어요';
  const description = isHost
    ? '송금 시작하기를 누르면 각 멤버의 송금 금액이 확정돼요.'
    : '호스트가 송금 정보를 준비하면 내 송금 금액을 확인할 수 있어요.';

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      <PaymentHeaderWrapper />

      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-5 text-center">
        <div className="space-y-2">
          <p className="text-base font-medium text-gray-800">{message}</p>
          <p className="text-sm leading-5 text-gray-400">{description}</p>
        </div>

        {isHost && (
          <Button
            variant="basic"
            size="lg"
            onClick={onInitialize}
            disabled={isInitializing}
            className="mt-2 w-full max-w-[240px] text-sm"
          >
            {isInitializing ? '송금 준비 중' : '송금 시작하기'}
          </Button>
        )}

        {errorMessage && (
          <p className="text-sm text-[var(--status-negative)]">
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
}
