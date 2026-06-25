'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { WaitTimeScreen } from '../preview/screens/WaitTimeScreen';
import { setWaitDeadline } from '../api/placeApi';
import { placeKeys } from '../api/placeKeys';

/**
 * 실제 라우트용 — 호스트가 대기시간 설정 → 마감시각(now+선택) 저장(① meeting PATCH) → 대기화면 이동.
 */
export function WaitSetupView({ meetingId }: { meetingId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutate, isPending, error } = useMutation({
    mutationFn: (seconds: number) =>
      setWaitDeadline(
        meetingId,
        new Date(Date.now() + seconds * 1000).toISOString()
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: placeKeys.waitDeadline(meetingId),
      });
      router.push(`/meetings/${meetingId}/place/waiting`);
    },
  });

  return (
    <div className="relative h-full">
      <WaitTimeScreen
        onNext={(seconds) => {
          if (!isPending) mutate(seconds);
        }}
      />
      {error && (
        <div className="absolute bottom-24 left-5 right-5 rounded-[var(--radius-12)] bg-[var(--status-negative)] px-4 py-3 text-[13px] text-white shadow-[var(--shadow-medium)]">
          저장 실패: {error instanceof Error ? error.message : '알 수 없는 오류'}
        </div>
      )}
    </div>
  );
}
