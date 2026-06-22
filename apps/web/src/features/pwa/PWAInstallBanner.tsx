'use client';

import { useState, useEffect } from 'react';
import { usePWAInstall } from './usePWAInstall';

const SESSION_KEY = 'pwa-install-banner-dismissed';

export function PWAInstallBanner() {
  const { canInstall, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(true); // 초기값 true로 SSR flicker 방지

  useEffect(() => {
    setDismissed(sessionStorage.getItem(SESSION_KEY) === 'true');
  }, []);

  function handleDismiss() {
    sessionStorage.setItem(SESSION_KEY, 'true');
    setDismissed(true);
  }

  if (!canInstall || dismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-base)] border-t border-[var(--line-normal)] px-5 py-4 flex flex-col gap-3 safe-area-bottom">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[15px] font-semibold text-[var(--label-strong)]">
            yummpi 앱으로 설치하기
          </span>
          <span className="text-[13px] text-[var(--label-alternative)]">
            홈 화면에 추가하면 더 편리하게 이용할 수 있어요
          </span>
        </div>
        <button
          onClick={handleDismiss}
          className="shrink-0 p-1 text-[var(--label-alternative)] hover:text-[var(--label-normal)]"
          aria-label="닫기"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M5 5L15 15M5 15L15 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
      <button
        onClick={install}
        className="w-full h-12 rounded-xl bg-[var(--primary)] text-white text-[15px] font-semibold"
      >
        홈 화면에 추가
      </button>
    </div>
  );
}
