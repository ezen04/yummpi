'use client';

import { useState } from 'react';
import { PaymentLoadingSkeleton } from '@/features/payment/components/PaymentLoadingSkeleton';
import { PaymentEmptyState } from '@/features/payment/components/PaymentEmptyState';
import { PaymentErrorState } from '@/features/payment/components/PaymentErrorState';
import { PaymentSummaryPanel } from '@/features/payment/components/PaymentSummaryPanel';
import { PaymentMemberList } from '@/features/payment/components/PaymentMemberList';
import type { PaymentSummary, PaymentListItem } from '@yummpi/schemas';

const MOCK_SUMMARY_IN_PROGRESS: PaymentSummary = {
  totalAmount: 141000,
  paidAmount: 47000,
  resolvedAmount: 94000,
  unresolvedAmount: 47000,
  totalCount: 6,
  completedCount: 2,
  reportedCount: 1,
  pendingCount: 3,
};

const MOCK_SUMMARY_ALL_DONE: PaymentSummary = {
  totalAmount: 69000,
  paidAmount: 69000,
  resolvedAmount: 69000,
  unresolvedAmount: 0,
  totalCount: 3,
  completedCount: 3,
  reportedCount: 0,
  pendingCount: 0,
};

const MOCK_PAYMENTS_HOST: PaymentListItem[] = [
  {
    paymentId: '1',
    meetingMemberId: 'm1',
    displayName: '김지훈',
    amount: 23500,
    status: 'PAID',
    paidAt: '2026-06-19T10:00:00Z',
    canReportTransfer: false,
    canMarkPaid: false,
    canMarkPending: true,
    canMarkExempt: false,
    transferMock: null,
  },
  {
    paymentId: '2',
    meetingMemberId: 'm2',
    displayName: '이수진',
    amount: 23500,
    status: 'EXEMPT',
    paidAt: null,
    canReportTransfer: false,
    canMarkPaid: false,
    canMarkPending: false,
    canMarkExempt: false,
    transferMock: null,
  },
  {
    paymentId: '3',
    meetingMemberId: 'm3',
    displayName: '박민준',
    amount: 23500,
    status: 'TRANSFER_REPORTED',
    paidAt: null,
    canReportTransfer: false,
    canMarkPaid: true,
    canMarkPending: false,
    canMarkExempt: false,
    transferMock: null,
  },
  {
    paymentId: '4',
    meetingMemberId: 'm4',
    displayName: '최서연',
    amount: 23500,
    status: 'PENDING',
    paidAt: null,
    canReportTransfer: false,
    canMarkPaid: false,
    canMarkPending: false,
    canMarkExempt: true,
    transferMock: null,
  },
  {
    paymentId: '5',
    meetingMemberId: 'm5',
    displayName: '정현우',
    amount: 23500,
    status: 'PENDING',
    paidAt: null,
    canReportTransfer: false,
    canMarkPaid: false,
    canMarkPending: false,
    canMarkExempt: true,
    transferMock: null,
  },
  {
    paymentId: '6',
    meetingMemberId: 'm6',
    displayName: '강다은',
    amount: 23500,
    status: 'PENDING',
    paidAt: null,
    canReportTransfer: false,
    canMarkPaid: false,
    canMarkPending: false,
    canMarkExempt: true,
    transferMock: null,
  },
];

type Section =
  | 'loading'
  | 'empty'
  | 'error'
  | 'summary-progress'
  | 'summary-done'
  | 'member-list-host';

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'loading', label: '로딩' },
  { id: 'empty', label: '정산 미확정' },
  { id: 'error', label: '에러' },
  { id: 'summary-progress', label: '요약 (진행 중)' },
  { id: 'summary-done', label: '요약 (완료)' },
  { id: 'member-list-host', label: '멤버 리스트 (호스트)' },
];

export default function PaymentPreviewPage() {
  const [active, setActive] = useState<Section>('member-list-host');

  return (
    <div className="min-h-screen bg-[var(--bg-alternative)]">
      {/* 탭 네비게이션 */}
      <div className="sticky top-0 z-10 bg-[var(--bg-normal)] border-b border-[var(--line-normal)] px-4 py-3 flex gap-2 overflow-x-auto">
        {SECTIONS.map(({ id, label }) => (
          <button
            key={id}
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

      {/* 미리보기 영역 — 모바일 프레임 (402px) */}
      <div className="flex justify-center py-6 px-4">
        <div
          className="w-full max-w-[402px] bg-[var(--bg-normal)] rounded-2xl overflow-hidden"
          style={{ minHeight: 600, boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}
        >
          {active === 'loading' && <PaymentLoadingSkeleton />}
          {active === 'empty' && <PaymentEmptyState />}
          {active === 'error' && (
            <PaymentErrorState
              message="송금 현황을 불러오지 못했어요"
              onRetry={() => alert('재시도 클릭!')}
            />
          )}
          {active === 'summary-progress' && (
            <div className="pt-[104px] space-y-4">
              <PaymentSummaryPanel summary={MOCK_SUMMARY_IN_PROGRESS} />
            </div>
          )}
          {active === 'summary-done' && (
            <div className="pt-[104px] space-y-4">
              <PaymentSummaryPanel summary={MOCK_SUMMARY_ALL_DONE} />
            </div>
          )}
          {active === 'member-list-host' && (
            <div className="pt-[104px]">
              <div className="px-5 mb-4">
                <PaymentSummaryPanel summary={MOCK_SUMMARY_IN_PROGRESS} />
              </div>
              <PaymentMemberList
                payments={MOCK_PAYMENTS_HOST}
                onAction={(paymentId, action) =>
                  alert(`paymentId: ${paymentId}\naction: ${action}`)
                }
              />
            </div>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-[var(--label-assistive)] pb-8">
        개발 전용 미리보기
      </p>
    </div>
  );
}
