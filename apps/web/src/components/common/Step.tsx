'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check } from '@yummpi/ui';

interface StepProps {
  steps: string[];
  current: number; // 0-based
  className?: string;
}

export function Step({ steps, current, className }: StepProps) {
  return (
    <div className={cn('flex items-center w-full', className)}>
      {steps.map((label, i) => {
        const isDone = i < current;
        const isNow = i === current;

        return (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center gap-[6px]">
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
                  isDone
                    ? 'bg-[var(--primary)]'
                    : isNow
                      ? 'bg-transparent border-2 border-[var(--primary)]'
                      : 'bg-transparent border-[1.5px] border-[var(--line-normal)]',
                )}
              >
                {isDone ? (
                  <Check size={12} strokeWidth={1.8} color="white" />
                ) : (
                  <span
                    className={cn(
                      'text-[11px] font-medium font-[var(--font-sans)] leading-none',
                      isNow ? 'text-[var(--primary)]' : 'text-[var(--label-assistive)]',
                    )}
                  >
                    {i + 1}
                  </span>
                )}
              </div>

              <span
                className={cn(
                  'text-[11px] leading-[14px] font-[var(--font-sans)] whitespace-nowrap',
                  isNow ? 'font-semibold' : 'font-normal',
                  isDone || isNow ? 'text-[var(--label-normal)]' : 'text-[var(--label-assistive)]',
                )}
              >
                {label}
              </span>
            </div>

            {i < steps.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-[1.5px] mb-5 mx-1',
                  i < current ? 'bg-[var(--primary)]' : 'bg-[var(--line-normal)]',
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
