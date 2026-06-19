'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface YAvatarProps {
  variant?: 'host' | 'guest';
  src?: string;
  name: string;
  size?: number;
  className?: string;
}

export function YAvatar({
  variant = 'guest',
  src,
  name,
  size = 40,
  className,
}: YAvatarProps) {
  const initial = name.charAt(0).toUpperCase();
  const isHost = variant === 'host';
  const borderWidth = isHost ? 2 : 1.5;
  const borderColor = isHost ? 'var(--primary)' : 'var(--line-normal)';

  return (
    <div
      className={cn(
        'rounded-full overflow-hidden shrink-0 bg-[var(--fill-normal)]',
        'flex items-center justify-center relative',
        isHost
          ? 'border-2 border-[var(--primary)]'
          : 'border-[1.5px] border-[var(--line-normal)]',
        className
      )}
      style={{ width: size, height: size }}
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
            'font-semibold font-[var(--font-sans)] select-none',
            isHost ? 'text-[var(--primary)]' : 'text-[var(--label-alternative)]'
          )}
          style={{ fontSize: Math.round(size * 0.38) }}
        >
          {initial}
        </span>
      )}
    </div>
  );
}
