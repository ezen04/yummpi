'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Eye } from '@yummpi/ui';

interface TipboxProps {
  variant?: 'normal' | 'completed-vote' | 'completed-title';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Tipbox({
  variant = 'normal',
  title,
  children,
  className,
}: TipboxProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-[10px]',
        'rounded-[var(--radius-10)] bg-[var(--secondary-tint)]',
        className,
      )}
    >
      <Eye size={20} strokeWidth={1.5} color="var(--secondary-strong)" className="shrink-0" />

      <div className="flex-1">
        {title && variant === 'completed-title' && (
          <p className="text-[13px] leading-[18px] font-semibold font-[var(--font-sans)] text-[var(--secondary-strong)] mb-[2px] mt-0">
            {title}
          </p>
        )}
        <p className="text-[13px] leading-[18px] font-normal font-[var(--font-sans)] text-[var(--secondary-strong)] m-0">
          {children}
        </p>
      </div>
    </div>
  );
}
