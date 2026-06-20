'use client';

import { useState } from 'react';
import { PaymentMemberList } from './PaymentMemberList';
import { PaymentHostBottomBar } from './PaymentHostBottomBar';
import { MeetingCompleteModal } from './MeetingCompleteModal';
import type { PaymentListItem, PaymentAction, PaymentSummary } from '@yummpi/schemas';

type Props = {
  summary: PaymentSummary;
  payments: PaymentListItem[];
  meetingId: string;
  onAction: (paymentId: string, action: PaymentAction) => void;
  onCompleted: () => void;
};

export function PaymentHostView({ summary, payments, meetingId, onAction, onCompleted }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <PaymentMemberList payments={payments} onAction={onAction} />
      <PaymentHostBottomBar
        summary={summary}
        onComplete={() => setModalOpen(true)}
      />
      <MeetingCompleteModal
        open={modalOpen}
        meetingId={meetingId}
        onClose={() => setModalOpen(false)}
        onCompleted={() => {
          setModalOpen(false);
          onCompleted();
        }}
      />
    </>
  );
}
