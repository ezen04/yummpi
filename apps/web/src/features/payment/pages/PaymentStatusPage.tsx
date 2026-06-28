'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PaymentErrorState } from '../components/shell/PaymentErrorState';
import { PaymentHeaderWrapper } from '../components/shell/PaymentHeaderWrapper';
import { PaymentLoadingSkeleton } from '../components/shell/PaymentLoadingSkeleton';
import { PaymentNotInitializedState } from '../components/shell/PaymentNotInitializedState';
import { PaymentHostView } from '../components/host/PaymentHostView';
import { useCompletePayments } from '../hooks/useCompletePayments';
import { useInitializePayments } from '../hooks/useInitializePayments';
import { usePaymentActions } from '../hooks/usePaymentActions';
import { usePaymentStatus } from '../hooks/usePaymentStatus';
import { isPaymentApiError } from '../api/paymentApi';
import { formatCooldownUntil } from '../utils/transferMock';
import { toast } from '@yummpi/ui';
import type { PaymentAction } from '@yummpi/schemas';

type Props = {
  meetingId: string;
};

const HOST_ACTION_SUCCESS_MESSAGE: Partial<Record<PaymentAction, string>> = {
  REMIND: '독촉 알림을 보냈어요',
  MARK_PAID: '입금을 확인했어요',
  MARK_PENDING: '대기 상태로 되돌렸어요',
  MARK_EXEMPT: '면제 처리했어요',
};

export function PaymentStatusPage({ meetingId }: Props) {
  const router = useRouter();
  const { updatePayment } = usePaymentActions(meetingId);
  const initializePayments = useInitializePayments(meetingId);
  const completePayments = useCompletePayments(meetingId);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(
    null
  );

  const { data, isLoading, isError, apiError, isSettlementNotReady, refetch } =
    usePaymentStatus(meetingId);

  useEffect(() => {
    if (!data || data.viewerRole === 'HOST' || data.summary.totalCount === 0)
      return;

    const myPayment = data.payments.find((p) => p.isMine);
    if (!myPayment) return;

    // 회원 멤버: PENDING/TRANSFER_REPORTED 일 때만 /transfer로 이동.
    // PAID/EXEMPT 회원 멤버는 현 위치에서 호스트 현황과 동일 화면을 본다.
    // 게스트: 상태 관계없이 /transfer (게스트는 호스트 현황 미노출 정책).
    const shouldRedirect =
      myPayment.isGuest ||
      myPayment.status === 'PENDING' ||
      myPayment.status === 'TRANSFER_REPORTED';

    if (shouldRedirect) {
      router.replace(`/meetings/${meetingId}/payments/transfer`);
    }
  }, [data, router, meetingId]);

  async function handleHostAction(paymentId: string, action: PaymentAction) {
    setActionErrorMessage(null);
    try {
      await updatePayment({ paymentId, action });
      const message = HOST_ACTION_SUCCESS_MESSAGE[action];
      if (message) toast.success(message);
    } catch (error) {
      if (isPaymentApiError(error)) {
        if (error.code === 'REMIND_COOLDOWN') {
          const details = error.details as
            | { remindCooldownUntil?: string }
            | undefined;
          const until = details?.remindCooldownUntil;
          setActionErrorMessage(
            until
              ? `독촉 알림은 24시간에 한 번만 보낼 수 있어요. ${formatCooldownUntil(until)} 이후 다시 보낼 수 있습니다.`
              : error.message
          );
        } else {
          setActionErrorMessage(error.message);
        }
      } else {
        setActionErrorMessage(
          '처리 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.'
        );
      }
    }
  }

  const initializeErrorMessage = initializePayments.apiError
    ? initializePayments.apiError.message
    : initializePayments.error
      ? '송금 시작 중 오류가 발생했어요. 다시 시도해 주세요.'
      : undefined;

  const completeErrorMessage = completePayments.error
    ? '모임 종료에 실패했어요. 다시 시도해주세요.'
    : undefined;

  const screen = (() => {
    if (isLoading) return <PaymentLoadingSkeleton />;

    if (isError) {
      if (isSettlementNotReady) {
        return <PaymentErrorState message="정산이 아직 확정되지 않았어요" />;
      }
      return (
        <PaymentErrorState
          message={apiError?.message}
          onRetry={() => void refetch()}
        />
      );
    }

    if (!data) return <PaymentLoadingSkeleton />;

    if (data.summary.totalCount === 0) {
      return (
        <PaymentNotInitializedState
          viewerRole={data.viewerRole}
          onInitialize={() => initializePayments.mutate()}
          isInitializing={initializePayments.isPending}
          errorMessage={initializeErrorMessage}
        />
      );
    }

    /* 멤버/게스트: 본인 PAID/EXEMPT 회원만 현 위치에 머무름. 그 외는 redirect 대기 — 스켈레톤으로 플래시 방지 */
    if (data.viewerRole !== 'HOST') {
      const myPayment = data.payments.find((p) => p.isMine);
      const stayHere =
        myPayment &&
        !myPayment.isGuest &&
        (myPayment.status === 'PAID' || myPayment.status === 'EXEMPT');
      if (!stayHere) return <PaymentLoadingSkeleton />;
    }

    return (
      <>
        <PaymentHeaderWrapper />
        <PaymentHostView
          summary={data.summary}
          payments={data.payments}
          viewerRole={data.viewerRole}
          onAction={handleHostAction}
          actionErrorMessage={actionErrorMessage ?? undefined}
          onCompleteMeeting={async () => {
            await completePayments.mutateAsync();
          }}
          onCompleted={() =>
            router.push(`/meetings/${meetingId}/payments/complete`)
          }
          isCompleting={completePayments.isPending}
          completeErrorMessage={completeErrorMessage}
        />
      </>
    );
  })();

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-[var(--bg-normal)]">
      {screen}
    </div>
  );
}
