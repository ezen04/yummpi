'use client';

import { useState } from 'react';
import { Icon } from '@/components/common/Icon';
import { Footer } from '@/components/common/Footer';
import { formatAmount } from '../../utils/transferMock';
import { RegisterAccountBottomSheet } from './RegisterAccountBottomSheet';
import '../payment-montage.css';

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
        <div className="text-center py-5">
          <p className="mtg-label1 text-[var(--label-alternative)]">내가 보낼 금액</p>
          <p className="text-[40px] font-bold text-[var(--label-strong)] leading-tight tracking-[-1px] mt-2 [font-variant-numeric:tabular-nums]">
            {formatAmount(amount)}
          </p>
        </div>

        {/* 안내 영역 */}
        <div className="flex flex-col items-center justify-center gap-5 py-6">
          <div className="w-24 h-24 rounded-full bg-[var(--primary-tint)] flex items-center justify-center">
            <Icon name="wallet" size={40} color="var(--primary)" />
          </div>
          <div className="flex flex-col items-center gap-2.5 text-center">
            <p className="mtg-headline1 is-bold text-[var(--label-strong)]">
              입금 받을 계좌가 필요해요
            </p>
            <p className="mtg-body2r text-[var(--label-alternative)]">
              계좌가 아직 등록되지 않았어요.<br />
              송금 받기 위한 계좌를 먼저 등록해주세요.
            </p>
          </div>
          <div className="w-full mt-2">
            <button
              onClick={() => setIsSheetOpen(true)}
              className="w-full h-14 rounded-[14px] bg-[var(--primary)] text-[var(--static-white)] text-[16px] font-semibold cursor-pointer border-none flex items-center justify-center gap-1.5"
            >
              <Icon name="plus" size={20} color="var(--static-white)" />
              주최자 계좌 등록
            </button>
          </div>
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
