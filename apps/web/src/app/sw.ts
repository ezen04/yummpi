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
        plugins: [
          new ExpirationPlugin({
            maxEntries: 30,
            maxAgeSeconds: 60 * 60 * 24 * 365,
          }),
        ],
      }),
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();

// 웹푸시 수신 → 알림 표시. worker(payment-reminder)는 { title, body, url } JSON으로 보낸다.
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const payload = event.data.json() as {
    title: string;
    body?: string;
    url?: string;
  };
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      data: { url: payload.url ?? '/' },
    })
  );
});

// 알림 클릭 → 이미 열린 탭이 있으면 포커스, 없으면 새 창으로 해당 화면 열기.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data as { url?: string } | null)?.url ?? '/';
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      })
  );
});
