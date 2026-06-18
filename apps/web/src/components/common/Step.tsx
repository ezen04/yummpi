'use client';

import * as React from 'react';

interface StepProps {
  steps: string[];
  current: number; // 0-based
}

export function Step({ steps, current }: StepProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
      {steps.map((label, i) => {
        const isDone = i < current;
        const isNow = i === current;

        return (
          <React.Fragment key={i}>
            {/* 스텝 원 + 라벨 */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  ...(isDone
                    ? { background: 'var(--primary)', border: 'none' }
                    : isNow
                      ? {
                          background: 'transparent',
                          border: '2px solid var(--primary)',
                        }
                      : {
                          background: 'transparent',
                          border: '1.5px solid var(--line-normal)',
                        }),
                }}
              >
                {isDone ? (
                  <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                    <path
                      d="M1 5L4.5 8.5L11 1.5"
                      stroke="white"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <span
                    style={{
                      font: '500 11px var(--font-sans)',
                      color: isNow
                        ? 'var(--primary)'
                        : 'var(--label-assistive)',
                      lineHeight: 1,
                    }}
                  >
                    {i + 1}
                  </span>
                )}
              </div>

              <span
                style={{
                  font: `${isNow ? '600' : '400'} 11px/14px var(--font-sans)`,
                  color:
                    isDone || isNow
                      ? 'var(--label-normal)'
                      : 'var(--label-assistive)',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </span>
            </div>

            {/* 연결선 */}
            {i < steps.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 1.5,
                  background:
                    i < current ? 'var(--primary)' : 'var(--line-normal)',
                  marginBottom: 20,
                  marginLeft: 4,
                  marginRight: 4,
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
