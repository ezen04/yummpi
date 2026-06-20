'use client';

import { PaymentHostView } from '../components/host/PaymentHostView';
import type {
  PaymentAction,
  PaymentListItem,
  PaymentSummary,
} from '@yummpi/schemas';

type Props = {
  summary: PaymentSummary;
  payments: PaymentListItem[];
  onAction: (paymentId: string, action: PaymentAction) => void;
  onCompleteMeeting: () => Promise<void>;
  onCompleted: () => void;
  isCompleting?: boolean;
  completeErrorMessage?: string;
};

export function PaymentHostStatusView(props: Props) {
  return <PaymentHostView {...props} />;
}
