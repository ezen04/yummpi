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

  const { mutate, isPending } = useMutation({
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
    <WaitTimeScreen
      onNext={(seconds) => {
        if (!isPending) mutate(seconds);
      }}
    />
  );
}
