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
};

const SECTIONS: SectionDef[] = [
  {
    title: '정산 완료',
    filter: (item) => item.status === 'PAID' || item.status === 'EXEMPT',
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
    <div className="flex flex-col">
      {SECTIONS.map(({ title, filter }) => {
        const items = payments.filter(filter);
        if (items.length === 0) return null;

        return (
          <div key={title}>
            {/* 섹션 헤더 */}
            <div className="px-5 h-[52px] flex items-center">
              <span className="text-xs font-semibold text-[var(--label-alternative)]">
                {title}
              </span>
              <span className="ml-1.5 text-xs text-[var(--label-assistive)]">
                {items.length}명
              </span>
            </div>

            {/* 멤버 아이템 목록 */}
            <div className="divide-y divide-[var(--line-alternative)]">
              {items.map((item) => (
                <PaymentMemberItem
                  key={item.paymentId}
                  item={item}
                  onAction={onAction}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
