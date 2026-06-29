'use client';

import * as React from 'react';
import Picker from 'react-mobile-picker';
import { cn } from './utils';

/**
 * iOS 스타일 휠 시간 picker (시:분).
 * - 가운데 행이 선택값 (옅은 회색 배경 + primary 색 강조)
 * - 위·아래 행은 점차 흐려지는 다른 시간/분 값
 * - 분 단위는 `minuteStep`으로 조정 (기본 5)
 * - visible 행은 `wheelHeight` 컬럼 prop으로 7개 표시
 */
export interface WheelTimePickerValue {
  hour: number;
  minute: number;
}

export interface WheelTimePickerProps {
  value: WheelTimePickerValue;
  onChange: (next: WheelTimePickerValue) => void;
  /** 분 단위 step (기본 5) */
  minuteStep?: number;
  className?: string;
}

export function WheelTimePicker({
  value,
  onChange,
  minuteStep = 5,
  className,
}: WheelTimePickerProps) {
  const hourOptions = React.useMemo(
    () => Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')),
    []
  );
  const minuteOptions = React.useMemo(
    () =>
      Array.from({ length: Math.floor(60 / minuteStep) }, (_, i) =>
        String(i * minuteStep).padStart(2, '0')
      ),
    [minuteStep]
  );

  // 외부 value → picker 내부 string value 매핑
  const pickerValue = React.useMemo(
    () => ({
      hour: String(value.hour).padStart(2, '0'),
      minute: String(value.minute).padStart(2, '0'),
    }),
    [value]
  );

  const handleChange = (next: { hour: string; minute: string }) => {
    onChange({
      hour: Number(next.hour),
      minute: Number(next.minute),
    });
  };

  // 트랙패드/마우스 wheel 속도 throttle.
  // wheelMode="natural"이 작은 deltaY에도 반응이 빨라 트랙패드에서 1번에 여러 행 넘어감.
  // wheel 이벤트를 100ms throttle로 캡처해 라이브러리 도달 빈도를 낮춤.
  // 모바일 touch 이벤트는 wheel과 무관 → 영향 없음.
  //
  // React onWheelCapture는 root에서 passive listener로 등록되어 preventDefault가
  // 무시되고 콘솔 경고가 뜸. native addEventListener + { passive: false }로 직접 등록.
  const containerRef = React.useRef<HTMLDivElement>(null);
  const lastWheelRef = React.useRef(0);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handler = (e: WheelEvent) => {
      const now = Date.now();
      if (now - lastWheelRef.current < 100) {
        e.stopPropagation();
        e.preventDefault();
        return;
      }
      lastWheelRef.current = now;
    };

    el.addEventListener('wheel', handler, { passive: false, capture: true });
    return () => {
      el.removeEventListener('wheel', handler, { capture: true });
    };
  }, []);

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <Picker
        value={pickerValue}
        onChange={handleChange}
        wheelMode="natural"
        height={216}
        itemHeight={36}
        className="time-wheel"
      >
        <Picker.Column name="hour">
          {hourOptions.map((h) => (
            <Picker.Item key={h} value={h}>
              {({ selected }) => (
                <div
                  className={cn(
                    'text-[20px] leading-7 font-[var(--font-sans)] text-right pr-1',
                    selected
                      ? 'font-semibold text-[var(--primary)]'
                      : 'font-normal text-[var(--label-alternative)]'
                  )}
                >
                  {h}
                </div>
              )}
            </Picker.Item>
          ))}
        </Picker.Column>
        <Picker.Column name="minute">
          {minuteOptions.map((m) => (
            <Picker.Item key={m} value={m}>
              {({ selected }) => (
                <div
                  className={cn(
                    'text-[20px] leading-7 font-[var(--font-sans)] text-left pl-1',
                    selected
                      ? 'font-semibold text-[var(--primary)]'
                      : 'font-normal text-[var(--label-alternative)]'
                  )}
                >
                  {m}
                </div>
              )}
            </Picker.Item>
          ))}
        </Picker.Column>
      </Picker>
      {/* 가운데 강조 행 (옅은 회색 배경) — Picker 내부 highlight 위에 absolute 오버레이.
          pointer-events-none으로 휠 스크롤 방해 X */}
      <div
        aria-hidden
        className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-9 bg-[var(--fill-normal)] rounded-[var(--radius-8)] pointer-events-none"
      />
      {/* 가운데 콜론 */}
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[20px] leading-7 font-semibold text-[var(--primary)] pointer-events-none"
      >
        :
      </div>
    </div>
  );
}
