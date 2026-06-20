'use client';

import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { completePayments } from '../api/paymentApi';
import { paymentKeys } from '../api/paymentKeys';

export function useCompletePayments(meetingId: string) {
  const queryClient = useQueryClient();

  const invalidatePayments = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: paymentKeys.list(meetingId) });
  }, [meetingId, queryClient]);

  return useMutation({
    mutationFn: () => completePayments(meetingId),
    onSuccess: invalidatePayments,
  });
}
