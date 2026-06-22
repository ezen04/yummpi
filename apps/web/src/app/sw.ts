/// <reference lib="webworker" />
import type { PrecacheEntry } from 'serwist';
import { defaultCache } from '@serwist/next/worker';
import { Serwist, CacheFirst, ExpirationPlugin } from 'serwist';

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Pretendard 폰트 CDN — 오프라인 PWA에서도 폰트 유지
    {
      matcher: ({ url }) => url.hostname === 'cdn.jsdelivr.net',
      handler: new CacheFirst({
        cacheName: 'cdn-fonts',
        plugins: [new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 })],
      }),
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();
