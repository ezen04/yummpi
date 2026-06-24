'use client';

import { useState } from 'react';
import { Header } from '@/components/common/Header';
import { Button } from '@/components/common/Button';
import { WAIT_OPTIONS, WAIT_OPTION_SECONDS } from '../optimalPreviewMock';

interface WaitTimeScreenProps {
  /** '다음' 클릭 시 환산된 대기시간(초)을 전달. 프리뷰 토글 단독 사용 시 생략 가능 */
  onNext?: (seconds: number) => void;
}

// 화면④ 다른 게스트의 역 입력을 얼마나 기다릴까요? (Figma 755-4096)
export function WaitTimeScreen({ onNext }: WaitTimeScreenProps) {
  const [selected, setSelected] = useState<string>('1시간');
  const [customMin, setCustomMin] = useState<string>('');

  const isCustom = selected === '직접설정';
  const customValid = isCustom ? Number(customMin) > 0 : true;

  const handleNext = () => {
    const seconds = isCustom
      ? Math.round(Number(customMin) * 60)
      : WAIT_OPTION_SECONDS[selected];
    if (!seconds || seconds <= 0) return;
    if (onNext) onNext(seconds);
    else
      console.log('[optimal-preview] 대기시간 설정:', selected, seconds, '초');
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg-normal)]">
      <Header onBack={() => {}} onClose={() => {}} />

      <div className="flex-1 min-h-0 overflow-y-auto px-5 pt-2">
        <h1 className="text-center text-[20px] font-bold leading-[28px] text-[var(--label-normal)]">
          다른 게스트의 역 입력을
          <br />
          얼마나 기다릴까요?
        </h1>
        <p className="text-center text-[13px] leading-[18px] text-[var(--label-alternative)] mt-2">
          설정한 시간동안 역 입력을 받습니다
          <br />
          (시간 내 입력되지 않은 게스트는 제외)
        </p>

        <div className="flex flex-col gap-2.5 mt-7">
          {WAIT_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setSelected(opt)}
              className={`h-12 rounded-[var(--radius-12)] border text-[15px] font-medium transition-colors ${
                selected === opt
                  ? 'border-[var(--primary)] bg-[var(--primary-tint)] text-[var(--primary)]'
                  : 'border-[var(--line-normal)] text-[var(--label-normal)]'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        {/* 직접설정: 분 단위 입력 */}
        {isCustom && (
          <div className="mt-3 flex items-center gap-2 h-12 px-4 rounded-[var(--radius-12)] border border-[var(--line-normal)] focus-within:border-[var(--primary)] transition-colors">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              value={customMin}
              onChange={(e) => setCustomMin(e.target.value)}
              placeholder="기다릴 시간을 입력하세요"
              className="flex-1 min-w-0 bg-transparent outline-none text-[15px] text-[var(--label-normal)] placeholder:text-[var(--label-assistive)]"
              autoFocus
            />
            <span className="text-[15px] text-[var(--label-alternative)] shrink-0">
              분
            </span>
          </div>
        )}

        <p className="text-center text-[12px] text-[var(--label-assistive)] mt-4">
          시간을 설정한 약속 시간 이하로 설정해주세요
        </p>
      </div>

      <div className="px-5 pt-3 pb-5">
        <Button
          variant="basic"
          size="lg"
          className="w-full"
          disabled={!customValid}
          onClick={handleNext}
        >
          다음
        </Button>
      </div>
    </div>
  );
}
