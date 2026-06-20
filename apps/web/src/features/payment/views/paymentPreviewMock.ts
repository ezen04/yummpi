import type { PaymentListItem, PaymentSummary } from '@yummpi/schemas';

export const PAYMENT_PREVIEW_MEETING_ID =
  '00000000-0000-0000-0000-000000000000';

export const MOCK_SUMMARY_IN_PROGRESS: PaymentSummary = {
  totalAmount: 164500,
  paidAmount: 47000,
  resolvedAmount: 70500,
  unresolvedAmount: 94000,
  totalCount: 7,
  completedCount: 3,
  reportedCount: 1,
  pendingCount: 3,
};

export const MOCK_SUMMARY_ALL_DONE: PaymentSummary = {
  totalAmount: 69000,
  paidAmount: 69000,
  resolvedAmount: 69000,
  unresolvedAmount: 0,
  totalCount: 3,
  completedCount: 3,
  reportedCount: 0,
  pendingCount: 0,
};

export const MOCK_ITEM_HOST_SELF: PaymentListItem = {
  paymentId: 'p-host-self',
  meetingMemberId: 'm-host',
  displayName: '나 (지훈)',
  amount: 23500,
  status: 'PAID',
  paidAt: '2026-06-20T10:00:00Z',
  isMine: true,
  isGuest: false,
  remindCooldownUntil: null,
  canReportTransfer: false,
  canCancelTransfer: false,
  canMarkPaid: false,
  canMarkPending: false,
  canMarkExempt: false,
  transferMock: null,
};

export const MOCK_PAYMENTS_HOST_IN_PROGRESS: PaymentListItem[] = [
  MOCK_ITEM_HOST_SELF,
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
    remindCooldownUntil: null,
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

export const MOCK_PAYMENTS_HOST_ALL_DONE: PaymentListItem[] = [
  MOCK_ITEM_HOST_SELF,
  {
    paymentId: 'done-1',
    meetingMemberId: 'done-m1',
    displayName: '김지훈',
    amount: 23000,
    status: 'PAID',
    paidAt: '2026-06-20T11:00:00Z',
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
    paymentId: 'done-2',
    meetingMemberId: 'done-m2',
    displayName: '이수진',
    amount: 22500,
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
];

export const MOCK_ITEM_MEMBER_PENDING: PaymentListItem = {
  paymentId: 'p-member-pending',
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

export const MOCK_ITEM_MEMBER_REPORTED: PaymentListItem = {
  ...MOCK_ITEM_MEMBER_PENDING,
  paymentId: 'p-member-reported',
  status: 'TRANSFER_REPORTED',
  canReportTransfer: false,
  canCancelTransfer: true,
};

export const MOCK_ITEM_MEMBER_PAID: PaymentListItem = {
  ...MOCK_ITEM_MEMBER_PENDING,
  paymentId: 'p-member-paid',
  status: 'PAID',
  paidAt: '2026-06-20T14:00:00Z',
  canReportTransfer: false,
};

export const MOCK_ITEM_MEMBER_EXEMPT: PaymentListItem = {
  ...MOCK_ITEM_MEMBER_PENDING,
  paymentId: 'p-member-exempt',
  status: 'EXEMPT',
  canReportTransfer: false,
};

export const MOCK_ITEM_GUEST_PENDING: PaymentListItem = {
  ...MOCK_ITEM_MEMBER_PENDING,
  paymentId: 'p-guest-pending',
  meetingMemberId: 'g-me',
  displayName: '나 (바삭감자)',
  isGuest: true,
};

export type PaymentPreviewSection =
  | 'common-loading'
  | 'common-not-ready'
  | 'common-join-required'
  | 'not-initialized-host'
  | 'not-initialized-member'
  | 'host-in-progress'
  | 'host-all-done'
  | 'host-transfer-confirm'
  | 'member-pending'
  | 'member-reported'
  | 'member-paid'
  | 'member-exempt'
  | 'guest-pending'
  | 'meeting-completed';

export const PAYMENT_PREVIEW_SECTIONS: {
  id: PaymentPreviewSection;
  label: string;
}[] = [
  { id: 'common-loading', label: '공통 — 로딩' },
  { id: 'common-not-ready', label: '공통 — 정산 미확정' },
  { id: 'common-join-required', label: '공통 — 참여 필요' },
  { id: 'not-initialized-host', label: '미초기화 — 호스트' },
  { id: 'not-initialized-member', label: '미초기화 — 멤버/게스트' },
  { id: 'host-in-progress', label: '호스트 — 진행중' },
  { id: 'host-all-done', label: '호스트 — 전원완료' },
  { id: 'host-transfer-confirm', label: '호스트 — 입금 확인 모달' },
  { id: 'member-pending', label: '멤버 — 송금 전' },
  { id: 'member-reported', label: '멤버 — 확인 대기' },
  { id: 'member-paid', label: '멤버 — 입금 완료' },
  { id: 'member-exempt', label: '멤버 — 면제' },
  { id: 'guest-pending', label: '게스트 — 송금 전' },
  { id: 'meeting-completed', label: '모임 종료 완료' },
];
