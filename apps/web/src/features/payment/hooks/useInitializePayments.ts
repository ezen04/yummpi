'use client';

import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { initializePayments, isPaymentApiError } from '../api/paymentApi';
import { paymentKeys } from '../api/paymentKeys';

export function useInitializePayments(meetingId: string) {
  const queryClient = useQueryClient();

  const invalidatePayments = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: paymentKeys.list(meetingId) });
  }, [meetingId, queryClient]);

  const mutation = useMutation({
    mutationFn: () => initializePayments(meetingId),
    onSuccess: invalidatePayments,
  });

  return {
    ...mutation,
    apiError: isPaymentApiError(mutation.error) ? mutation.error : null,
  };
}
