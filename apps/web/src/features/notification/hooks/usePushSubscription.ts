'use client';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

export function usePushSubscription() {
  async function subscribe(): Promise<{ ok: boolean; error?: string }> {
    if (typeof Notification === 'undefined') {
      return { ok: false, error: '이 브라우저는 알림을 지원하지 않아요.' };
    }

    let permission = Notification.permission;

    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission === 'denied') {
      return {
        ok: false,
        error: '브라우저 알림 권한이 거부됐어요. 브라우저 설정에서 허용해주세요.',
      };
    }

    if (!('serviceWorker' in navigator)) {
      return { ok: false, error: '서비스 워커를 지원하지 않는 브라우저예요.' };
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const res = await fetch('/api/v1/push/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (!res.ok) throw new Error();
      return { ok: true };
    } catch {
      return { ok: false, error: '알림 구독 등록에 실패했어요. 다시 시도해주세요.' };
    }
  }

  async function unsubscribe(): Promise<{ ok: boolean; error?: string }> {
    if (!('serviceWorker' in navigator)) return { ok: true };

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription =
        await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        const res = await fetch('/api/v1/push/subscriptions', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        if (!res.ok) throw new Error();
      }

      return { ok: true };
    } catch {
      return { ok: false, error: '알림 구독 해제에 실패했어요. 다시 시도해주세요.' };
    }
  }

  return { subscribe, unsubscribe };
}
