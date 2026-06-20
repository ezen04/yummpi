'use client';

import { TransferActionPanel } from '../transfer/TransferActionPanel';
import type { PaymentListItem } from '@yummpi/schemas';

type Props = {
  item: PaymentListItem;
  hostNickname?: string;
  onRefresh: () => void;
  onReportTransfer: (paymentId: string) => Promise<void>;
  onCancelTransfer: (paymentId: string) => Promise<void>;
};

export function PaymentMemberView({
  item,
  hostNickname,
  onRefresh,
  onReportTransfer,
  onCancelTransfer,
}: Props) {
  return (
    <TransferActionPanel
      item={item}
      hostNickname={hostNickname}
      onRefresh={onRefresh}
      onReportTransfer={onReportTransfer}
      onCancelTransfer={onCancelTransfer}
    />
  );
}
