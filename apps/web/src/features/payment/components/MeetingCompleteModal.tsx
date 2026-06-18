'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@yummpi/ui';
import { Button } from '@yummpi/ui';
import { completePayments } from '../lib/paymentApi';

type Props = {
  open: boolean;
  meetingId: string;
  onClose: () => void;
  onCompleted: () => void;
};

export function MeetingCompleteModal({ open, meetingId, onClose, onCompleted }: Props) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setIsPending(true);
    setError(null);
    try {
      await completePayments(meetingId);
      onCompleted();
    } catch {
      setError('모임 종료에 실패했어요. 다시 시도해주세요.');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !isPending) onClose(); }}>
      <DialogContent className="max-w-[342px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-[var(--label-strong)]">
            모임을 마감하시겠습니까?
          </DialogTitle>
          <DialogDescription className="text-sm text-[var(--label-alternative)] mt-1">
            모임 마감 후에는 송금 관리가 어렵습니다.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="text-xs text-[var(--status-negative)] px-1">{error}</p>
        )}

        <DialogFooter className="flex-row gap-2 mt-2">
          <Button
            variant="outline"
            className="flex-1 h-11 rounded-xl text-sm"
            onClick={onClose}
            disabled={isPending}
          >
            취소
          </Button>
          <Button
            className="flex-1 h-11 rounded-xl text-sm"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? '처리 중...' : '종료하기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
