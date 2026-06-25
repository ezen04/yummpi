'use client';

import { useCallback, useState } from 'react';
import {
  PREVIEW_SECTIONS,
  DEFAULT_WAIT_SECONDS,
  type PreviewSection,
} from './optimalPreviewMock';
import { PlaceUndecidedScreen } from './screens/PlaceUndecidedScreen';
import { DepartureInputScreen } from './screens/DepartureInputScreen';
import { DepartureSearchScreen } from './screens/DepartureSearchScreen';
import { WaitTimeScreen } from './screens/WaitTimeScreen';
import { WaitingInputScreen } from './screens/WaitingInputScreen';
import { AllInputDoneScreen } from './screens/AllInputDoneScreen';
import { MidpointResultScreen } from './screens/MidpointResultScreen';

// 출발역 입력 → 중간지점 플로우 dev 미리보기 (payment-preview 패턴)
export function OptimalPreviewView() {
  const [active, setActive] = useState<PreviewSection>('place-undecided');
  // ④ 대기시간 선택값(초) → ⑤ 타이머 시작값으로 전달
  const [waitSeconds, setWaitSeconds] = useState<number>(DEFAULT_WAIT_SECONDS);

  const handleWaitTimeNext = useCallback((seconds: number) => {
    setWaitSeconds(seconds);
    setActive('waiting-input');
  }, []);
  const handleTimerExpire = useCallback(() => setActive('all-done'), []);

  return (
    <div className="h-screen bg-[var(--bg-alternative)] flex flex-col overflow-hidden">
      {/* 상단 토글 — 화면 전환 */}
      <div className="sticky top-0 z-10 bg-[var(--bg-normal)] border-b border-[var(--line-normal)] px-4 py-3 flex gap-2 overflow-x-auto">
        {PREVIEW_SECTIONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActive(id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              active === id
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--bg-alternative)] text-[var(--label-alternative)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 모바일 프레임 */}
      <div className="flex-1 min-h-0 flex justify-center py-6 px-4">
        <div className="w-full max-w-[390px] bg-[var(--bg-normal)] rounded-2xl overflow-hidden h-full max-h-[844px] shadow-[var(--shadow-medium)]">
          <PreviewContent
            active={active}
            waitSeconds={waitSeconds}
            onWaitTimeNext={handleWaitTimeNext}
            onTimerExpire={handleTimerExpire}
          />
        </div>
      </div>

      <p className="shrink-0 text-center text-xs text-[var(--label-assistive)] pb-4">
        개발 전용 미리보기 — 출발역 입력 → 중간지점 플로우
      </p>
    </div>
  );
}

interface PreviewContentProps {
  active: PreviewSection;
  waitSeconds: number;
  onWaitTimeNext: (seconds: number) => void;
  onTimerExpire: () => void;
}

function PreviewContent({
  active,
  waitSeconds,
  onWaitTimeNext,
  onTimerExpire,
}: PreviewContentProps) {
  switch (active) {
    case 'place-undecided':
      return <PlaceUndecidedScreen />;
    case 'departure-input':
      return <DepartureInputScreen />;
    case 'departure-search':
      return <DepartureSearchScreen />;
    case 'wait-time':
      return <WaitTimeScreen onNext={onWaitTimeNext} />;
    case 'waiting-input':
      return (
        <WaitingInputScreen
          startSeconds={waitSeconds}
          onExpire={onTimerExpire}
        />
      );
    case 'all-done':
      return <AllInputDoneScreen />;
    case 'midpoint':
      return <MidpointResultScreen />;
    default:
      return null;
  }
}
