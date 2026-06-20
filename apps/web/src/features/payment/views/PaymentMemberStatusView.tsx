'use client';

import { PaymentMemberView } from '../components/member/PaymentMemberView';
import type { PaymentListItem } from '@yummpi/schemas';

type Props = {
  item: PaymentListItem;
  hostNickname?: string;
  onRefresh: () => void;
  onReportTransfer: (paymentId: string) => Promise<void>;
  onCancelTransfer: (paymentId: string) => Promise<void>;
};

export function PaymentMemberStatusView(props: Props) {
  return (
    <div className="flex-1">
      <PaymentMemberView {...props} />
    </div>
  );
}
