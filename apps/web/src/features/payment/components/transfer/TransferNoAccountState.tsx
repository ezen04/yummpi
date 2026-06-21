'use client';

import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Icon } from '@/components/common/Icon';
import {
  type HostAccountMock,
  useHostAccountStore,
} from '../../stores/useHostAccountStore';
import { RegisterAccountBottomSheet } from './RegisterAccountBottomSheet';
import '../payment-montage.css';

type Props = {
  viewerRole: 'HOST' | 'MEMBER';
  onRegisterAccount?: () => void;
};

export function TransferNoAccountState({
  viewerRole,
  onRegisterAccount,
}: Props) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const setAccount = useHostAccountStore((s) => s.setAccount);
  const isHost = viewerRole === 'HOST';

  function handleSubmit(data: HostAccountMock) {
    setAccount(data);
    setIsSheetOpen(false);
    onRegisterAccount?.();
  }

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col items-center justify-center gap-5 flex-1 px-5 py-6 text-center">
        <div className="w-24 h-24 rounded-full bg-[var(--primary-tint)] flex items-center justify-center">
          <Icon name="wallet" size={40} color="var(--primary)" />
        </div>

        <div className="flex flex-col items-center gap-2.5">
          <p className="mtg-headline1 is-bold text-[var(--label-strong)]">
            입금 받을 계좌가 필요해요
          </p>
          <p className="mtg-body2r text-[var(--label-alternative)]">
            계좌가 아직 등록되지 않았어요.
            <br />
            송금 받기 위한 계좌를 먼저 등록해주세요.
          </p>
        </div>

        {isHost && (
          <div className="w-full mt-2">
            <Button
              variant="basic"
              size="lg"
              onClick={() => setIsSheetOpen(true)}
              leftIcon={
                <Icon name="plus" size={20} color="var(--static-white)" />
              }
              className="w-full h-14 rounded-[14px] gap-1.5"
            >
              주최자 계좌 등록
            </Button>
          </div>
        )}
      </div>

      {isHost && (
        <RegisterAccountBottomSheet
          isOpen={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
