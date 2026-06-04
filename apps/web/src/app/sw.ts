/// <reference lib="webworker" />
// Serwist 서비스워커 — ⑤가 캐싱 전략 확장. iOS는 '홈 화면 추가' 후에만 웹푸시 가능(이메일 fallback 병행).
import { defaultCache } from '@serwist/next/worker';
import { Serwist } from 'serwist';

declare const self: ServiceWorkerGlobalScope & { __SW_MANIFEST: any };

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
