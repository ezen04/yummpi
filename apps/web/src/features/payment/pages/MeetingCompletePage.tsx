'use client';

import { usePaymentStatus } from '../hooks/usePaymentStatus';
import { PaymentErrorState } from '../components/shell/PaymentErrorState';
import { PaymentLoadingSkeleton } from '../components/shell/PaymentLoadingSkeleton';
import { MeetingCompletedView } from '../components/completion/MeetingCompletedView';

type Props = {
  meetingId: string;
};

export function MeetingCompletePage({ meetingId }: Props) {
  const { data, isLoading, isError, apiError, refetch } =
    usePaymentStatus(meetingId);

  const screen = (() => {
    if (isLoading) return <PaymentLoadingSkeleton />;
    if (isError)
      return (
        <PaymentErrorState
          message={apiError?.message}
          onRetry={() => void refetch()}
        />
      );
    if (!data) return <PaymentLoadingSkeleton />;
    return <MeetingCompletedView summary={data.summary} />;
  })();

  return <div className="h-dvh flex flex-col overflow-hidden">{screen}</div>;
}
