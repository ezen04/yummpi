'use client';

import { useState } from 'react';
import { PaymentLoadingSkeleton } from '@/features/payment/components/PaymentLoadingSkeleton';
import { PaymentErrorState } from '@/features/payment/components/PaymentErrorState';
import { PaymentSummaryPanel } from '@/features/payment/components/PaymentSummaryPanel';
import { PaymentMemberList } from '@/features/payment/components/PaymentMemberList';
import { PaymentNotInitializedState } from '@/features/payment/components/PaymentNotInitializedState';
import { TransferActionPanel } from '@/features/payment/components/transfer/TransferActionPanel';
import { MeetingCompletedView } from '@/features/payment/components/MeetingCompletedView';
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
    isMine: false,
    isGuest: false,
    remindCooldownUntil: null,
    canReportTransfer: false,
    canCancelTransfer: false,
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
    isMine: false,
    isGuest: false,
    remindCooldownUntil: null,
    canReportTransfer: false,
    canCancelTransfer: false,
    canMarkPaid: false,
    canMarkPending: false,
    canMarkExempt: false,
    transferMock: null,
  },
  {
    paymentId: '3',
    meetingMemberId: 'm3',
    displayName: '남남펭권',
    amount: 23500,
    status: 'TRANSFER_REPORTED',
    paidAt: null,
    isMine: false,
    isGuest: true,
    remindCooldownUntil: null,
    canReportTransfer: false,
    canCancelTransfer: false,
    canMarkPaid: true,
    canMarkPending: false,
    canMarkExempt: false,
    transferMock: null,
  },
  {
    paymentId: '4',
    meetingMemberId: 'm4',
    displayName: '바삭감자',
    amount: 23500,
    status: 'PENDING',
    paidAt: null,
    isMine: false,
    isGuest: true,
    remindCooldownUntil: null,
    canReportTransfer: false,
    canCancelTransfer: false,
    canMarkPaid: false,
    canMarkPending: false,
    canMarkExempt: true,
    transferMock: null,
  },
  {
    paymentId: '5',
    meetingMemberId: 'm5',
    displayName: '최민준',
    amount: 23500,
    status: 'PENDING',
    paidAt: null,
    isMine: false,
    isGuest: false,
    remindCooldownUntil: '2026-06-20T11:30:00Z',
    canReportTransfer: false,
    canCancelTransfer: false,
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
    isMine: false,
    isGuest: false,
    remindCooldownUntil: null,
    canReportTransfer: false,
    canCancelTransfer: false,
    canMarkPaid: false,
    canMarkPending: false,
    canMarkExempt: true,
    transferMock: null,
  },
];

const MOCK_ITEM_PENDING: PaymentListItem = {
  paymentId: 'p-pending',
  meetingMemberId: 'm-me',
  displayName: '나 (박민준)',
  amount: 23500,
  status: 'PENDING',
  paidAt: null,
  isMine: true,
  isGuest: false,
  remindCooldownUntil: null,
  canReportTransfer: true,
  canCancelTransfer: false,
  canMarkPaid: false,
  canMarkPending: false,
  canMarkExempt: false,
  transferMock: null,
};

const MOCK_ITEM_REPORTED: PaymentListItem = {
  paymentId: 'p-reported',
  meetingMemberId: 'm-me',
  displayName: '나 (박민준)',
  amount: 23500,
  status: 'TRANSFER_REPORTED',
  paidAt: null,
  isMine: true,
  isGuest: false,
  remindCooldownUntil: null,
  canReportTransfer: false,
  canCancelTransfer: true,
  canMarkPaid: false,
  canMarkPending: false,
  canMarkExempt: false,
  transferMock: null,
};



type Section =
  | 'loading'
  | 'error'
  | 'summary-progress'
  | 'summary-done'
  | 'member-list-host'
  | 'host-transfer-confirm'
  | 'not-initialized-host'
  | 'not-initialized-member'
  | 'member-no-account'
  | 'member-pending'
  | 'member-reported'
  | 'member-no-payment'
  | 'meeting-completed';

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'loading', label: '로딩' },
  { id: 'error', label: '에러' },
  { id: 'summary-progress', label: '요약 (진행 중)' },
  { id: 'summary-done', label: '요약 (완료)' },
  { id: 'member-list-host', label: '멤버 리스트 (호스트)' },
  { id: 'host-transfer-confirm', label: '호스트 — 송금 확인' },
  { id: 'not-initialized-host', label: '미초기화 (호스트)' },
  { id: 'not-initialized-member', label: '미초기화 (멤버)' },
  { id: 'member-no-account', label: '멤버 — 계좌 미등록' },
  { id: 'member-pending', label: '멤버 — 송금 전' },
  { id: 'member-reported', label: '멤버 — 송금 신고' },
  { id: 'member-no-payment', label: '멤버 — 내 정보 없음' },
  { id: 'meeting-completed', label: '모임 종료 완료' },
];

export default function PaymentPreviewPage() {
  const [active, setActive] = useState<Section>('member-list-host');
  const [hasHostAccount, setHasHostAccount] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--bg-alternative)]">
      {/* 탭 네비게이션 */}
      <div className="sticky top-0 z-10 bg-[var(--bg-normal)] border-b border-[var(--line-normal)] px-4 py-3 flex gap-2 overflow-x-auto">
        {SECTIONS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => { setActive(id); setHasHostAccount(false); }}
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

      {/* 미리보기 영역 - 모바일 프레임 (390px) */}
      <div className="flex justify-center py-6 px-4">
        <div
          className="w-full max-w-[390px] bg-[var(--bg-normal)] rounded-2xl overflow-x-hidden overflow-y-auto h-[844px] shadow-[var(--shadow-medium)]"
        >
          {active === 'loading' && <PaymentLoadingSkeleton />}
          {active === 'error' && (
            <PaymentErrorState
              message="송금 현황을 불러오지 못했어요"
              onRetry={() => alert('재시도 클릭!')}
            />
          )}
          {active === 'summary-progress' && (
            <div className="pt-4 space-y-4">
              <PaymentSummaryPanel summary={MOCK_SUMMARY_IN_PROGRESS} />
            </div>
          )}
          {active === 'summary-done' && (
            <div className="pt-4 space-y-4">
              <PaymentSummaryPanel summary={MOCK_SUMMARY_ALL_DONE} />
            </div>
          )}
          {active === 'member-list-host' && (
            <div className="pt-4">
              <div className="mb-4">
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
          {active === 'host-transfer-confirm' && (
            <div className="pt-4">
              <div className="mb-4">
                <PaymentSummaryPanel summary={MOCK_SUMMARY_IN_PROGRESS} />
              </div>
              <PaymentMemberList
                payments={MOCK_PAYMENTS_HOST}
                onAction={(paymentId, action) =>
                  alert(`paymentId: ${paymentId}\naction: ${action}`)
                }
              />
              <p className="text-xs text-center text-[var(--label-assistive)] py-2">
                ↑ TRANSFER_REPORTED 항목의 &quot;송금 확인&quot; 버튼을 눌러보세요
              </p>
            </div>
          )}
          {active === 'not-initialized-host' && (
            <PaymentNotInitializedState
              viewerRole="HOST"
              meetingId="00000000-0000-0000-0000-000000000000"
            />
          )}
          {active === 'not-initialized-member' && (
            <PaymentNotInitializedState
              viewerRole="MEMBER"
              meetingId="00000000-0000-0000-0000-000000000000"
            />
          )}
          {active === 'member-no-account' && (
            <div className="flex flex-col min-h-[600px]">
              <TransferActionPanel
                item={MOCK_ITEM_PENDING}
                meetingId="00000000-0000-0000-0000-000000000000"
                hostNickname="지훈"
                hasHostAccount={hasHostAccount}
                onRegisterAccount={() => setHasHostAccount(true)}
                onRefresh={() => {}}
              />
            </div>
          )}
          {active === 'member-pending' && (
            <div className="flex flex-col min-h-[600px]">
              <TransferActionPanel
                item={MOCK_ITEM_PENDING}
                meetingId="00000000-0000-0000-0000-000000000000"
                hostNickname="지훈"
                onRefresh={() => alert('REPORT_TRANSFER 호출!')}
              />
            </div>
          )}
          {active === 'member-reported' && (
            <div className="flex flex-col min-h-[600px]">
              <TransferActionPanel
                item={MOCK_ITEM_REPORTED}
                meetingId="00000000-0000-0000-0000-000000000000"
                hostNickname="지훈"
                onRefresh={() => alert('MARK_PENDING 호출!')}
              />
            </div>
          )}
          {active === 'member-no-payment' && (
            <PaymentErrorState
              message="내 송금 정보를 찾을 수 없어요"
              onRetry={() => alert('재시도 클릭!')}
            />
          )}
          {active === 'meeting-completed' && (
            <MeetingCompletedView
              summary={MOCK_SUMMARY_ALL_DONE}
              meetingName="금요일 저녁 회식"
              placeName="강남 화로상회"
              placeDateTime="6.13 (금) 19:00"
            />
          )}
        </div>
      </div>

      <p className="text-center text-xs text-[var(--label-assistive)] pb-8">
        개발 전용 미리보기
      </p>
    </div>
  );
}
