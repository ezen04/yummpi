'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Check } from '@yummpi/ui';

type AttendanceVariant =
  | 'host'
  | 'user'
  | 'user-hover'
  | 'user-selected'
  | 'guest';

interface AttendanceProps {
  variant: AttendanceVariant;
  name: string;
  src?: string;
  size?: number;
  className?: string;
}

export function Attendance({
  variant,
  name,
  src,
  size = 56,
  className,
}: AttendanceProps) {
  const isHost = variant === 'host';
  const isSelected = variant === 'user-selected';
  const isHover = variant === 'user-hover';
  const isGuest = variant === 'guest';

  const borderColor =
    isHost || isSelected ? 'var(--primary)' : 'var(--line-normal)';
  const borderWidth = isHost || isSelected ? 2 : 1.5;

  return (
    <div className={cn('flex flex-col items-center gap-[6px]', className)}>
      <div className="relative">
        <div
          className={cn(
            'rounded-full flex items-center justify-center overflow-hidden transition-opacity duration-150',
            isHost || isSelected
              ? 'border-2 border-[var(--primary)]'
              : 'border-[1.5px] border-[var(--line-normal)]',
            isHover ? 'opacity-70' : 'opacity-100'
          )}
          style={{
            width: size,
            height: size,
            background: isHost ? 'var(--primary-tint)' : 'var(--fill-normal)',
          }}
        >
          {src ? (
            <Image
              src={src}
              alt={name}
              width={size}
              height={size}
              className="object-cover"
            />
          ) : (
            <span
              className={cn(
                'font-bold font-[var(--font-sans)] select-none',
                isHost
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--label-assistive)]'
              )}
              style={{ fontSize: Math.round(size * 0.4) }}
            >
              {name.charAt(0)}
            </span>
          )}
        </div>

        {isSelected && (
          <span className="absolute bottom-0 right-0 w-[18px] h-[18px] rounded-full bg-[var(--primary)] border-2 border-[var(--bg-normal)] flex items-center justify-center">
            <Check size={9} strokeWidth={1.4} color="var(--static-white)" />
          </span>
        )}
      </div>

      <span
        className={cn(
          'text-[11px] leading-[14px] font-[var(--font-sans)] truncate text-center',
          isHost || isSelected
            ? 'font-semibold text-[var(--label-normal)]'
            : 'font-normal text-[var(--label-alternative)]'
        )}
        style={{ maxWidth: size + 8 }}
      >
        {name}
      </span>
    </div>
  );
}
