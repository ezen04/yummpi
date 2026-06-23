'use client';

import { Button } from '@/components/common/Button';
import { Header } from '@/components/common/Header';

interface VoteErrorStateProps {
  message?: string;
  onRetry?: () => void;
  onBack?: () => void;
}

export function VoteErrorState({
  message = '투표 화면을 불러오지 못했어요',
  onRetry,
  onBack,
}: VoteErrorStateProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-[var(--bg-normal)]">
      <Header title="장소 투표" onBack={onBack} />

      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-5 text-center">
        <p className="text-[15px] leading-[22px] font-medium font-[var(--font-sans)] text-[var(--label-normal)] m-0">
          {message}
        </p>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="rounded-full px-5"
          >
            다시 시도
          </Button>
        )}
      </div>
    </div>
  );
}
