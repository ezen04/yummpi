'use client';

import { useState } from 'react';
import { PaymentMemberList } from './PaymentMemberList';
import { PaymentHostBottomBar } from './PaymentHostBottomBar';
import { MeetingCompleteModal } from './MeetingCompleteModal';
import type { PaymentListItem, PaymentAction, PaymentSummary } from '@yummpi/schemas';

type Props = {
  summary: PaymentSummary;
  payments: PaymentListItem[];
  viewerRole: 'HOST' | 'MEMBER';
  onAction: (paymentId: string, action: PaymentAction) => void;
  onCompleteMeeting: () => Promise<void>;
  onCompleted: () => void;
  isCompleting?: boolean;
  completeErrorMessage?: string;
};

export function PaymentHostView({
  summary,
  payments,
  viewerRole,
  onAction,
  onCompleteMeeting,
  onCompleted,
  isCompleting,
  completeErrorMessage,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  async function handleCompleteConfirm() {
    try {
      await onCompleteMeeting();
      setModalOpen(false);
      onCompleted();
    } catch {
      // Error message is provided by the container through completeErrorMessage.
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <PaymentMemberList
          payments={payments}
          viewerRole={viewerRole}
          onAction={onAction}
          summary={summary}
        />
      </div>
      {viewerRole === 'HOST' && (
        <>
          <PaymentHostBottomBar
            summary={summary}
            onComplete={() => setModalOpen(true)}
          />
          <MeetingCompleteModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            onConfirm={() => void handleCompleteConfirm()}
            isPending={isCompleting}
            errorMessage={completeErrorMessage}
          />
        </>
      )}
    </div>
  );
}
