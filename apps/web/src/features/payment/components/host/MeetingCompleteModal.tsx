'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@yummpi/ui';
import { Button } from '@yummpi/ui';

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
    <Dialog open={open} onOpenChange={(o) => { if (!o && !isPending) onClose(); }}>
      <DialogContent className="max-w-[342px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-[var(--label-strong)]">
            모임을 마감하시겠어요?
          </DialogTitle>
          <DialogDescription className="text-sm text-[var(--label-alternative)] mt-1">
            마감 후 이미 완료된 송금 목록을 확인할 수 있어요.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <p className="text-xs text-[var(--status-negative)] px-1">
            {errorMessage}
          </p>
        )}

        <DialogFooter className="flex-row gap-2 mt-2">
          <Button
            variant="outline"
            className="flex-1 h-11 rounded-xl text-sm"
            onClick={onClose}
            disabled={isPending}
          >
            아니요
          </Button>
          <Button
            className="flex-1 h-11 rounded-xl text-sm"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? '처리 중...' : '마감하기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
