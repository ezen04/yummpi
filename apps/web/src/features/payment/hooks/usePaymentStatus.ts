'use client';

import { useQuery } from '@tanstack/react-query';
import { getPayments, isPaymentApiError } from '../api/paymentApi';
import { paymentKeys } from '../api/paymentKeys';

const SETTLEMENT_NOT_READY_CODES = new Set([
  'INVALID_SETTLEMENT_STATUS',
  'SETTLEMENT_NOT_FOUND',
]);

export function usePaymentStatus(meetingId: string) {
  const query = useQuery({
    queryKey: paymentKeys.list(meetingId),
    queryFn: () => getPayments(meetingId),
    retry: false,
    staleTime: 30_000,
  });

  const apiError = isPaymentApiError(query.error) ? query.error : null;
  const isSettlementNotReady =
    !!apiError && SETTLEMENT_NOT_READY_CODES.has(apiError.code);

  return {
    ...query,
    apiError,
    isSettlementNotReady,
  };
}
