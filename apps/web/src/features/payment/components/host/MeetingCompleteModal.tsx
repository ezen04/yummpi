'use client';

import { PaymentConfirmbox } from '../shell/PaymentConfirmbox';

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending?: boolean;
  errorMessage?: string;
};

export function MeetingCompleteModal({
  open,
  onClose,
  onConfirm,
  isPending = false,
  errorMessage,
}: Props) {
  return (
    <PaymentConfirmbox
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      cancelLabel="아니요"
      confirmLabel={isPending ? '처리 중...' : '마감하기'}
      isPending={isPending}
      errorMessage={errorMessage}
    >
      <p className="text-base font-semibold text-[var(--label-strong)]">
        모임을 마감하시겠어요?
      </p>
      <p className="text-sm text-[var(--label-alternative)] mt-1">
        마감 후 이미 완료된 송금 목록을 확인할 수 있어요.
      </p>
    </PaymentConfirmbox>
  );
}
