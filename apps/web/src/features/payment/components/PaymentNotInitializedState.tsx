'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { initializePayments, isPaymentApiError } from '../lib/paymentApi';

type Props = {
  viewerRole: 'HOST' | 'MEMBER';
  meetingId: string;
};

export function PaymentNotInitializedState({ viewerRole, meetingId }: Props) {
  const queryClient = useQueryClient();
  const isHost = viewerRole === 'HOST';

  const mutation = useMutation({
    mutationFn: () => initializePayments(meetingId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['payments', meetingId] });
    },
  });

  const message = isHost
    ? '아직 멤버들에게 송금을 요청하지 않았어요'
    : '호스트가 아직 송금 정보를 준비하지 않았어요';
  const description = isHost
    ? '송금 시작하기를 누르면 각 멤버의 송금 금액이 확정돼요.'
    : '호스트가 송금 정보를 준비하면 내 송금 금액을 확인할 수 있어요.';
  const error = isPaymentApiError(mutation.error)
    ? mutation.error.message
    : mutation.error
      ? '송금 시작 중 오류가 발생했어요. 다시 시도해 주세요.'
      : null;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="h-[104px] px-5 flex items-end pb-4 border-b border-gray-100">
        <span className="text-base font-semibold mx-auto">송금 현황</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-5 text-center">
        <div className="space-y-2">
          <p className="text-base font-medium text-gray-800">{message}</p>
          <p className="text-sm leading-5 text-gray-400">{description}</p>
        </div>

        {isHost && (
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="mt-2 w-full max-w-[240px] h-12 rounded-lg bg-[var(--primary)] text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 active:opacity-90"
          >
            {mutation.isPending ? '송금 준비 중' : '송금 시작하기'}
          </button>
        )}

        {error && <p className="text-sm text-[var(--status-negative)]">{error}</p>}
      </div>
    </div>
  );
}
