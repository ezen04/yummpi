import webPush from 'web-push';

webPush.setVapidDetails(
  'mailto:hello@yummpi.app',
  process.env.VAPID_PUBLIC_KEY ?? '',
  process.env.VAPID_PRIVATE_KEY ?? ''
);

interface PushSubscription {
  endpoint: string;
  p256dhKey: string;
  authKey: string;
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

export async function sendWebPush(
  subscription: PushSubscription,
  payload: PushPayload
): Promise<void> {
  await webPush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dhKey,
        auth: subscription.authKey,
      },
    },
    JSON.stringify(payload)
  );
}
