'use client';

import { useRouter } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { useOptimalStation } from '../hooks/useOptimalStation';
import { MidpointResultScreen } from '../preview/screens/MidpointResultScreen';

/**
 * 실제 라우트용 — 출발역 기반 최적 역(STATION)을 API로 조회해 결과 화면에 연결.
 * 화면(MidpointResultScreen)은 dev 미리보기와 동일 컴포넌트를 재사용하고, 데이터만 실제 API로 주입.
 */
export function OptimalResultPage({ meetingId }: { meetingId: string }) {
  const router = useRouter();
  const { data, isLoading, isError, error } = useOptimalStation(meetingId);

  if (isLoading) {
    return (
      <StateScreen
        onBack={() => router.back()}
        message="최적 역을 계산하고 있어요…"
      />
    );
  }

  if (isError || !data) {
    return (
      <StateScreen
        onBack={() => router.back()}
        message={
          error instanceof Error
            ? error.message
            : '최적 역을 불러오지 못했어요.'
        }
        hint="멤버들이 출발지를 입력하면 다시 시도해주세요."
      />
    );
  }

  return (
    <MidpointResultScreen
      data={{
        latitude: Number(data.lat),
        longitude: Number(data.lng),
        placeLabel: data.name,
        maxDistanceM: data.maxDistanceM,
        excludedCount: data.excludedCount,
      }}
      onBack={() => router.back()}
      onNext={() => {
        // 후속(Phase 2+): 음식점 추천 화면으로 이동
      }}
    />
  );
}

function StateScreen({
  onBack,
  message,
  hint,
}: {
  onBack: () => void;
  message: string;
  hint?: string;
}) {
  return (
    <div className="h-full flex flex-col bg-[var(--bg-normal)]">
      <Header onBack={onBack} />
      <div className="flex-1 flex flex-col items-center justify-center gap-2 px-5 text-center">
        <p className="text-[15px] text-[var(--label-normal)]">{message}</p>
        {hint && (
          <p className="text-[13px] text-[var(--label-alternative)]">{hint}</p>
        )}
      </div>
    </div>
  );
}
