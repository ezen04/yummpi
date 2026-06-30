import * as React from 'react';
import { Crown, Locate } from '@yummpi/ui';
import { cn } from '@/lib/utils';

export type MapPinVariant = 'default' | 'selected' | 'topVote' | 'mine';

interface MapPinProps {
  variant?: MapPinVariant;
  /** 핀 머리 안에 들어갈 아이콘. 없으면 variant별 기본값 (default/selected/topVote=dot, mine=Locate) */
  icon?: React.ReactNode;
  /** 핀 아래에 떠 있는 라벨 (장소명/득표수 등) */
  label?: string;
  className?: string;
}

const SIZE: Record<
  MapPinVariant,
  { w: number; h: number; stroke: number; iconSize: number }
> = {
  default: { w: 56, h: 78, stroke: 2, iconSize: 20 },
  selected: { w: 68, h: 96, stroke: 2.5, iconSize: 24 },
  topVote: { w: 72, h: 102, stroke: 2.5, iconSize: 24 },
  mine: { w: 58, h: 80, stroke: 3, iconSize: 18 },
};

const FILL: Record<MapPinVariant, string> = {
  default: 'var(--primary)',
  selected: 'var(--primary)',
  topVote: 'var(--primary-strong)',
  mine: 'var(--primary)',
};

// 둥글고 통통한 teardrop — 머리 비율을 키우고 꼬리를 짧게
const TEARDROP_PATH =
  'M32 2 C 15 2 2 15 2 31 C 2 46 18 63 29.4 73 C 30.9 74.3 33.1 74.3 34.6 73 C 46 63 62 46 62 31 C 62 15 49 2 32 2 Z';

export function MapPin({
  variant = 'default',
  icon,
  label,
  className,
}: MapPinProps) {
  const { w, h, stroke, iconSize } = SIZE[variant];
  const fill = FILL[variant];
  const showGroundShadow = variant === 'selected' || variant === 'topVote';

  // variant 기본 아이콘: mine은 자기 위치를 가리키는 Locate 사용
  const resolvedIcon =
    icon ??
    (variant === 'mine' ? (
      <Locate size={iconSize} strokeWidth={2.2} aria-hidden />
    ) : null);

  return (
    <div
      className={cn('inline-flex flex-col items-center', className)}
      style={{ width: Math.max(w, 80) }}
    >
      <div className="relative" style={{ width: w, height: h + 12 }}>
        {variant === 'selected' && (
          <span
            aria-hidden
            className="absolute left-1/2 -translate-x-1/2 rounded-full"
            style={{
              top: w * 0.02,
              width: w * 1.3,
              height: w * 1.3,
              background: 'var(--tinted)',
              opacity: 0.28,
              filter: 'blur(6px)',
              zIndex: 0,
            }}
          />
        )}

        {showGroundShadow && (
          <span
            aria-hidden
            className="absolute left-1/2 -translate-x-1/2 rounded-full"
            style={{
              bottom: 0,
              width: w * 0.78,
              height: 12,
              background: 'var(--tinted)',
              opacity: 0.5,
              filter: 'blur(8px)',
              boxShadow: 'var(--shadow-pin-ground)',
              zIndex: 0,
            }}
          />
        )}

        <svg
          viewBox="0 0 64 80"
          width={w}
          height={h}
          className="relative block"
          style={{ filter: `drop-shadow(var(--shadow-pin))`, zIndex: 1 }}
        >
          <path
            d={TEARDROP_PATH}
            fill={fill}
            stroke="var(--static-white)"
            strokeWidth={stroke}
            strokeLinejoin="round"
          />
          <circle
            cx={32}
            cy={30}
            r={resolvedIcon ? 15 : 14}
            fill="var(--bg-normal)"
          />
        </svg>

        <div
          className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center"
          style={{
            top: h * (30 / 80) - iconSize / 2,
            width: iconSize,
            height: iconSize,
            zIndex: 2,
            color: fill,
          }}
        >
          {resolvedIcon ?? (
            <span
              aria-hidden
              className="block rounded-full"
              style={{ width: 10, height: 10, background: fill }}
            />
          )}
        </div>

        {variant === 'topVote' && (
          <div
            aria-hidden
            className="absolute flex items-center justify-center rounded-full"
            style={{
              top: -2,
              right: -2,
              width: 24,
              height: 24,
              background: 'var(--secondary)',
              color: 'var(--secondary-strong)',
              border: '2px solid var(--static-white)',
              boxShadow: 'var(--shadow-small)',
              zIndex: 3,
            }}
          >
            <Crown size={12} strokeWidth={2.4} aria-hidden />
          </div>
        )}
      </div>

      {label && (
        <span
          className="mt-1 px-2.5 py-1 text-caption1 font-semibold whitespace-nowrap [border-radius:var(--radius-full)]"
          style={{
            background: 'var(--bg-normal)',
            color: 'var(--label-normal)',
            border: '1px solid var(--line-warm)',
            boxShadow: 'var(--shadow-warm)',
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
