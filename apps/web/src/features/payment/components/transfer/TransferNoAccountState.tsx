'use client';

import { useState } from 'react';
import { Icon } from '@/components/common/Icon';
import { Footer } from '@/components/common/Footer';
import { formatAmount } from '../../lib/transferMock';
import { RegisterAccountBottomSheet } from './RegisterAccountBottomSheet';

type Props = {
  amount: number;
  onRegisterAccount?: () => void;
};

export function TransferNoAccountState({ amount, onRegisterAccount }: Props) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  function handleSubmit() {
    setIsSheetOpen(false);
    onRegisterAccount?.();
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col px-5 pt-6 pb-4 gap-8 flex-1">

        {/* 금액 헤더 */}
        <div>
          <p className="text-xs text-[var(--label-alternative)] mb-1">내가 보낼 금액</p>
          <p className="text-[28px] font-bold text-[var(--label-strong)] leading-none">
            {formatAmount(amount)}
          </p>
        </div>

        {/* 안내 영역 */}
        <div className="flex flex-col items-center justify-center gap-5 py-6">
          <div className="w-16 h-16 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
            <Icon name="wallet" size={28} color="var(--primary)" />
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-[17px] font-bold text-[var(--label-strong)]">
              입금 받을 계좌가 필요해요
            </p>
            <p className="text-sm text-[var(--label-alternative)] leading-5">
              계좌가 아직 등록되지 않았어요.<br />
              송금 받기 위한 계좌를 먼저 등록해주세요.
            </p>
          </div>
          <button
            onClick={() => setIsSheetOpen(true)}
            className="px-8 h-12 rounded-[var(--radius-12)] bg-[var(--primary)] text-[var(--static-white)] text-[15px] font-semibold cursor-pointer border-none"
          >
            주최자 계좌 등록
          </button>
        </div>

      </div>

      <Footer
        variant="button"
        label="송금 완료 알림 보내기"
        onClick={() => {}}
        disabled
        hint="아직 계좌가 등록되지 않았어요"
      />

      <RegisterAccountBottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
