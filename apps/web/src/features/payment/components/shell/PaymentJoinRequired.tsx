'use client';

import Link from 'next/link';
import { Icon } from '@/components/common/Icon';
import { PaymentHeaderWrapper } from './PaymentHeaderWrapper';

export function PaymentJoinRequired() {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      <PaymentHeaderWrapper />

      <div className="flex-1 flex flex-col items-center justify-center gap-5 px-5 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--bg-alternative)] flex items-center justify-center">
          <Icon name="users" size={28} color="var(--label-assistive)" />
        </div>

        <div className="space-y-2">
          <p className="text-base font-semibold text-[var(--label-strong)]">
            모임 참여 확인이 필요해요
          </p>
          <p className="text-sm text-[var(--label-alternative)] leading-5">
            송금 현황은 초대 링크로 입장한 멤버만 볼 수 있어요.
          </p>
          <p className="text-sm text-[var(--label-assistive)] leading-5">
            기존에 받은 초대 링크로 다시 입장해 주세요.
          </p>
        </div>

        <Link
          href="/"
          className="mt-2 px-6 h-12 rounded-[var(--radius-12)] bg-[var(--primary)] text-sm font-semibold text-white flex items-center justify-center"
        >
          홈으로 가기
        </Link>
      </div>
    </div>
  );
}
