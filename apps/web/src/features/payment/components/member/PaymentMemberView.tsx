'use client';

import { useQueryClient } from '@tanstack/react-query';
import { TransferActionPanel } from '../transfer/TransferActionPanel';
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

  return (
    <TransferActionPanel
      item={item}
      meetingId={meetingId}
      hostNickname={hostNickname}
      onRefresh={invalidate}
    />
  );
}
