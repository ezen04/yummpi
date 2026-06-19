'use client';

import { useQueryClient } from '@tanstack/react-query';
import { TransferActionPanel } from './transfer/TransferActionPanel';
import { TransferPendingState } from './transfer/TransferPendingState';
import { TransferDoneState } from './transfer/TransferDoneState';
import { TransferExemptState } from './transfer/TransferExemptState';
import type { PaymentListItem } from '@yummpi/schemas';

type Props = {
  item: PaymentListItem;
  meetingId: string;
  hostNickname?: string;
};

export function PaymentMemberView({ item, meetingId, hostNickname }: Props) {
  const queryClient = useQueryClient();

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ['payments', meetingId] });
  }

  if (item.status === 'PENDING') {
    return (
      <TransferActionPanel
        item={item}
        meetingId={meetingId}
        hostNickname={hostNickname}
        onTransferReported={invalidate}
      />
    );
  }

  if (item.status === 'TRANSFER_REPORTED') {
    return (
      <TransferPendingState
        item={item}
        meetingId={meetingId}
        onReverted={invalidate}
      />
    );
  }

  if (item.status === 'PAID') {
    return <TransferDoneState item={item} />;
  }

  if (item.status === 'EXEMPT') {
    return <TransferExemptState item={item} />;
  }

  return null;
}
