'use client';

import { PaymentMemberItem } from './PaymentMemberItem';
import type { PaymentListItem, PaymentAction } from '@yummpi/schemas';

type Props = {
  payments: PaymentListItem[];
  onAction?: (paymentId: string, action: PaymentAction) => void;
};

type SectionDef = {
  title: string;
  filter: (item: PaymentListItem) => boolean;
  emptyLabel?: string;
};

const SECTIONS: SectionDef[] = [
  {
    title: '정산 완료',
    filter: (item) => item.status === 'PAID' || item.status === 'EXEMPT',
    emptyLabel: '정산 완료 내역이 없어요',
  },
  {
    title: '정산 확인 필요',
    filter: (item) => item.status === 'TRANSFER_REPORTED',
  },
  {
    title: '미송금',
    filter: (item) => item.status === 'PENDING',
  },
];

export function PaymentMemberList({ payments, onAction }: Props) {
  return (
    <div className="flex flex-col pb-4">
      {SECTIONS.map(({ title, filter, emptyLabel }) => {
        const items = payments.filter(filter);

        // emptyLabel이 없는 섹션은 항목 없으면 숨김
        if (items.length === 0 && !emptyLabel) return null;

        return (
          <div key={title}>
            {/* 섹션 헤더 */}
            <div className="px-5 h-[52px] flex items-center">
              <span className={`text-xs font-semibold ${title === '미송금' ? 'text-[var(--status-negative)]' : 'text-[var(--label-alternative)]'}`}>
                {title}
              </span>
              {items.length > 0 && (
                <span className="ml-1.5 text-xs text-[var(--label-assistive)]">
                  {items.length}명
                </span>
              )}
            </div>

            {/* empty state */}
            {items.length === 0 && emptyLabel && (
              <div className="px-5 pb-4 text-center">
                <p className="text-xs text-[var(--label-assistive)]">
                  {emptyLabel}
                </p>
              </div>
            )}

            {/* 멤버 아이템 목록 — 카드 */}
            {items.length > 0 && (
              <div className="px-4 pb-2 flex flex-col gap-2">
                {items.map((item) => (
                  <div
                    key={item.paymentId}
                    className="rounded-[var(--radius-12)] bg-[var(--bg-normal)] shadow-[var(--shadow-medium)]"
                  >
                    <PaymentMemberItem item={item} onAction={onAction} />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
