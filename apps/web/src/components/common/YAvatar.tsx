'use client';

import * as React from 'react';
import Image from 'next/image';

interface YAvatarProps {
  variant?: 'host' | 'guest';
  src?: string;
  name: string;
  size?: number;
}

export function YAvatar({
  variant = 'guest',
  src,
  name,
  size = 40,
}: YAvatarProps) {
  const initial = name.charAt(0).toUpperCase();
  const isHost = variant === 'host';
  const borderWidth = isHost ? 2 : 1.5;
  const borderColor = isHost ? 'var(--primary)' : 'var(--line-normal)';

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: `${borderWidth}px solid ${borderColor}`,
        overflow: 'hidden',
        flexShrink: 0,
        background: 'var(--fill-normal)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          width={size}
          height={size}
          style={{ objectFit: 'cover' }}
        />
      ) : (
        <span
          style={{
            font: `600 ${Math.round(size * 0.38)}px var(--font-sans)`,
            color: isHost ? 'var(--primary)' : 'var(--label-alternative)',
            userSelect: 'none',
          }}
        >
          {initial}
        </span>
      )}
    </div>
  );
}
