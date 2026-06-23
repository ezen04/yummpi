'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@yummpi/ui';

// 호스트가 DRAFT 모임의 모집을 시작(RECRUITING 전이)하는 버튼.
// create 피처(meetingApi/hooks)에 의존하지 않도록 자체완결로 구현.
export function StartRecruitingButton({ meetingId }: { meetingId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/v1/meetings/${meetingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'RECRUITING' }),
      });
      const json = (await res.json()) as {
        success: boolean;
        error?: { message?: string };
      };
      if (!json.success) {
        setError(json.error?.message ?? '모집 시작에 실패했어요.');
        return;
      }
      // 허브(서버 컴포넌트) 재실행 → RECRUITING 단계로 갱신.
      router.refresh();
    } catch {
      setError('모집 시작에 실패했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="w-full space-y-2">
      <Button className="w-full" onClick={start} disabled={pending}>
        {pending ? '시작하는 중…' : '모집 시작하기'}
      </Button>
      {error && (
        <p
          className="text-center text-sm"
          style={{ color: 'var(--status-negative)' }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
