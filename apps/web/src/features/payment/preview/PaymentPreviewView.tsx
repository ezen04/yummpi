'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { MeetingCompletedView } from '@/features/payment/components/completion/MeetingCompletedView';
import { PaymentHostView } from '@/features/payment/components/host/PaymentHostView';
import { TransferActionPanel } from '@/features/payment/components/transfer/TransferActionPanel';
import { TransferNoAccountState } from '@/features/payment/components/transfer/TransferNoAccountState';
import { PaymentErrorState } from '@/features/payment/components/shell/PaymentErrorState';
import { PaymentHeaderWrapper } from '@/features/payment/components/shell/PaymentHeaderWrapper';
import { PaymentJoinRequired } from '@/features/payment/components/shell/PaymentJoinRequired';
import { PaymentLoadingSkeleton } from '@/features/payment/components/shell/PaymentLoadingSkeleton';
import { PaymentNotInitializedState } from '@/features/payment/components/shell/PaymentNotInitializedState';
import { PaymentSummaryPanel } from '@/features/payment/components/summary/PaymentSummaryPanel';
import type {
  PaymentAction,
  PaymentListItem,
  PaymentSummary,
} from '@yummpi/schemas';
import {
  MOCK_ITEM_GUEST_PENDING,
  MOCK_ITEM_MEMBER_PENDING,
  MOCK_ITEM_MEMBER_REPORTED,
  MOCK_PAYMENTS_HOST_ALL_DONE,
  MOCK_PAYMENTS_HOST_IN_PROGRESS,
  MOCK_PAYMENTS_MEMBER_VIEW_EXEMPT,
  MOCK_PAYMENTS_MEMBER_VIEW_PAID,
  MOCK_SUMMARY_ALL_DONE,
  MOCK_SUMMARY_IN_PROGRESS,
  PAYMENT_PREVIEW_SECTIONS,
  type PaymentPreviewSection,
} from './paymentPreviewMock';

export function PaymentPreviewView() {
  const [active, setActive] =
    useState<PaymentPreviewSection>('host-in-progress');

  return (
    <div className="h-screen bg-[var(--bg-alternative)] flex flex-col overflow-hidden">
      <div className="sticky top-0 z-10 bg-[var(--bg-normal)] border-b border-[var(--line-normal)] px-4 py-3 flex gap-2 overflow-x-auto">
        {PAYMENT_PREVIEW_SECTIONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActive(id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              active === id
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--bg-alternative)] text-[var(--label-alternative)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 flex justify-center py-6 px-4">
        <div className="w-full max-w-[390px] bg-[var(--bg-normal)] rounded-2xl overflow-hidden h-full max-h-[844px] shadow-[var(--shadow-medium)]">
          <PreviewContent active={active} />
        </div>
      </div>

      <p className="shrink-0 text-center text-xs text-[var(--label-assistive)] pb-4">
        개발 전용 미리보기
      </p>
    </div>
  );
}

function PreviewContent({ active }: { active: PaymentPreviewSection }) {
  if (active === 'common-loading') return <PaymentLoadingSkeleton />;

  if (active === 'common-not-ready') {
    return <PaymentErrorState message="정산이 아직 확정되지 않았어요" />;
  }

  if (active === 'common-join-required') return <PaymentJoinRequired />;

  if (active === 'not-initialized-host') {
    return (
      <PaymentNotInitializedState
        viewerRole="HOST"
        onInitialize={previewInitialize}
      />
    );
  }

  if (active === 'not-initialized-member') {
    return (
      <PaymentNotInitializedState
        viewerRole="MEMBER"
        onInitialize={previewInitialize}
      />
    );
  }

  if (active === 'host-in-progress') {
    return (
      <HostViewShell
        summary={MOCK_SUMMARY_IN_PROGRESS}
        payments={MOCK_PAYMENTS_HOST_IN_PROGRESS}
      />
    );
  }

  if (active === 'host-all-done') {
    return (
      <HostViewShell
        summary={MOCK_SUMMARY_ALL_DONE}
        payments={MOCK_PAYMENTS_HOST_ALL_DONE}
      />
    );
  }

  if (active === 'host-transfer-confirm') {
    return (
      <HostViewShell
        summary={MOCK_SUMMARY_IN_PROGRESS}
        payments={MOCK_PAYMENTS_HOST_IN_PROGRESS}
        hint="정산 확인 필요 항목의 완료 확인 버튼으로 모달 문구와 버튼을 확인하세요."
      />
    );
  }

  if (active === 'no-account-host') {
    return (
      <PaymentScreenShell>
        <TransferNoAccountState
          viewerRole="HOST"
          onRegisterAccount={previewRegisterAccount}
        />
      </PaymentScreenShell>
    );
  }

  if (active === 'no-account-member') {
    return (
      <PaymentScreenShell>
        <TransferNoAccountState viewerRole="MEMBER" />
      </PaymentScreenShell>
    );
  }

  if (active === 'member-pending') {
    return <MemberPreview item={MOCK_ITEM_MEMBER_PENDING} />;
  }

  if (active === 'member-reported') {
    return <MemberPreview item={MOCK_ITEM_MEMBER_REPORTED} />;
  }

  if (active === 'member-paid') {
    return (
      <HostViewShell
        summary={MOCK_SUMMARY_IN_PROGRESS}
        payments={MOCK_PAYMENTS_MEMBER_VIEW_PAID}
        viewerRole="MEMBER"
      />
    );
  }

  if (active === 'member-exempt') {
    return (
      <HostViewShell
        summary={MOCK_SUMMARY_IN_PROGRESS}
        payments={MOCK_PAYMENTS_MEMBER_VIEW_EXEMPT}
        viewerRole="MEMBER"
      />
    );
  }

  if (active === 'guest-pending') {
    return <MemberPreview item={MOCK_ITEM_GUEST_PENDING} hostNickname="지훈" />;
  }

  if (active === 'meeting-completed') {
    return (
      <MeetingCompletedView
        summary={MOCK_SUMMARY_ALL_DONE}
        meetingName="금요일 저녁 회식"
        placeName="강남 화로상회"
        placeDateTime="6.13 (금) 19:00"
      />
    );
  }

  return null;
}

function PaymentScreenShell({ children }: { children: ReactNode }) {
  return (
    <div className="h-full flex flex-col bg-[var(--bg-normal)]">
      <div className="shrink-0">
        <PaymentHeaderWrapper />
      </div>
      <div className="flex-1 min-h-0 flex flex-col">
        {children}
      </div>
    </div>
  );
}

function HostViewShell({
  summary,
  payments,
  viewerRole = 'HOST',
  hint,
}: {
  summary: PaymentSummary;
  payments: PaymentListItem[];
  viewerRole?: 'HOST' | 'MEMBER';
  hint?: string;
}) {
  return (
    <PaymentScreenShell>
      <PaymentHostView
        summary={summary}
        payments={payments}
        viewerRole={viewerRole}
        onAction={previewAction}
        onCompleteMeeting={previewCompleteMeeting}
        onCompleted={previewCompleted}
      />
      {hint && (
        <p className="px-5 pb-4 text-center text-xs text-[var(--label-assistive)]">
          {hint}
        </p>
      )}
    </PaymentScreenShell>
  );
}

function MemberPreview({
  item,
  hostNickname = '지훈',
  summary = MOCK_SUMMARY_IN_PROGRESS,
}: {
  item: PaymentListItem;
  hostNickname?: string;
  summary?: PaymentSummary;
}) {
  const showSummary = item.status !== 'PENDING';

  return (
    <PaymentScreenShell>
      {showSummary && (
        <div className="pt-4 pb-2">
          <PaymentSummaryPanel summary={summary} />
        </div>
      )}
      <TransferActionPanel
        item={item}
        hostNickname={hostNickname}
        onRefresh={previewRefresh}
        onReportTransfer={previewReportTransfer}
        onCancelTransfer={previewCancelTransfer}
      />
    </PaymentScreenShell>
  );
}

function previewAction(paymentId: string, action: PaymentAction) {
  alert(`paymentId: ${paymentId}\naction: ${action}`);
}

function previewInitialize() {
  alert('송금 시작하기');
}

async function previewCompleteMeeting() {
  alert('모임 마감 API 호출');
}

function previewCompleted() {
  alert('모임 종료 완료');
}

function previewRefresh() {
  alert('송금 현황 새로고침');
}

async function previewReportTransfer(paymentId: string) {
  alert(`REPORT_TRANSFER 호출\npaymentId: ${paymentId}`);
}

async function previewCancelTransfer(paymentId: string) {
  alert(`MARK_PENDING 호출\npaymentId: ${paymentId}`);
}

function previewRegisterAccount() {
  alert('주최자 계좌 등록 완료 (mock)');
}
