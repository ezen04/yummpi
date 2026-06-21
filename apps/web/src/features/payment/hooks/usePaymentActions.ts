'use client';

import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updatePayment } from '../api/paymentApi';
import { paymentKeys } from '../api/paymentKeys';
import type { PaymentAction } from '@yummpi/schemas';

type UpdatePaymentVariables = {
  paymentId: string;
  action: PaymentAction;
  invalidate?: boolean;
};

export function usePaymentActions(meetingId: string) {
  const queryClient = useQueryClient();

  const invalidatePayments = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: paymentKeys.list(meetingId),
    });
  }, [meetingId, queryClient]);

  const updatePaymentMutation = useMutation({
    mutationFn: ({ paymentId, action }: UpdatePaymentVariables) =>
      updatePayment(meetingId, paymentId, action),
    onSuccess: (_data, variables) => {
      if (variables.invalidate !== false) {
        invalidatePayments();
      }
    },
  });

  return {
    updatePayment: updatePaymentMutation.mutateAsync,
    updatePaymentMutation,
    invalidatePayments,
  };
}
