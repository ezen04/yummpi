'use client';

import * as React from 'react';
import Image from 'next/image';

type AttendanceVariant = 'host' | 'user' | 'user-hover' | 'user-selected' | 'guest';

interface AttendanceProps {
  variant: AttendanceVariant;
  name: string;
  src?: string;
  size?: number;
}

const AVATAR_BACKGROUNDS = ['#FBE2DF', '#FFF6E4', '#D6F5E0', '#FEE9FB'];

function getAvatarBg(name: string) {
  const index = name.charCodeAt(0) % AVATAR_BACKGROUNDS.length;
  return AVATAR_BACKGROUNDS[index];
}

export function Attendance({ variant, name, src, size = 56 }: AttendanceProps) {
  const isHost = variant === 'host';
  const isSelected = variant === 'user-selected';
  const isHover = variant === 'user-hover';
  const isGuest = variant === 'guest';

  const borderColor = isHost || isSelected
    ? 'var(--primary)'
    : 'var(--line-normal)';
  const borderWidth = isHost || isSelected ? 2 : 1.5;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative' }}>
        {/* 아바타 원형 */}
        <div
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            border: `${borderWidth}px solid ${borderColor}`,
            background: isGuest ? 'var(--fill-normal)' : getAvatarBg(name),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            opacity: isHover ? 0.7 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          {src ? (
            <Image src={src} alt={name} width={size} height={size} style={{ objectFit: 'cover' }} />
          ) : (
            <span
              style={{
                font: `700 ${Math.round(size * 0.4)}px var(--font-sans)`,
                color: isGuest ? 'var(--label-assistive)' : 'var(--label-normal)',
                userSelect: 'none',
              }}
            >
              {name.charAt(0)}
            </span>
          )}
        </div>


        {/* 선택됨 체크 뱃지 */}
        {isSelected && (
          <span
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: 'var(--primary)',
              border: '2px solid var(--bg-normal)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
              <path d="M1 3.5L3.2 5.5L8 1" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        )}
      </div>

      {/* 이름 */}
      <span
        style={{
          font: `${isHost || isSelected ? '600' : '400'} 11px/14px var(--font-sans)`,
          color: isHost || isSelected ? 'var(--label-normal)' : 'var(--label-alternative)',
          maxWidth: size + 8,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textAlign: 'center',
        }}
      >
        {name}
      </span>
    </div>
  );
}
