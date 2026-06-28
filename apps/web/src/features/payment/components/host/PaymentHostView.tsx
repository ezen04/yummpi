'use client';

import { useState } from 'react';
import { PaymentMemberList } from './PaymentMemberList';
import { PaymentHostBottomBar } from './PaymentHostBottomBar';
import { MeetingCompleteModal } from './MeetingCompleteModal';
import { HostAccountSection } from './HostAccountSection';
import type {
  PaymentListItem,
  PaymentAction,
  PaymentSummary,
} from '@yummpi/schemas';

type Props = {
  summary: PaymentSummary;
  payments: PaymentListItem[];
  viewerRole: 'HOST' | 'MEMBER';
  onAction: (paymentId: string, action: PaymentAction) => void;
  actionErrorMessage?: string;
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
  actionErrorMessage,
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
        {viewerRole === 'HOST' && <HostAccountSection />}
        {actionErrorMessage && (
          <div
            role="alert"
            className="mx-5 mt-3 rounded-md border border-[var(--status-negative)] bg-[var(--status-negative-tint)] px-3 py-2 text-sm text-[var(--status-negative)]"
          >
            {actionErrorMessage}
          </div>
        )}
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
