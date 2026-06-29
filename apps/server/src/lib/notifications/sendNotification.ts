import type { NotificationCategory } from '@prisma/client';
import { WebPushError } from 'web-push';
import { prisma } from '../prisma.js';
import { sendWebPush } from './webPush.js';
import { sendNotificationEmail } from './email.js';

/**
 * 구독 영구 폐기(410 Gone / 404 Not Found) → DB 정리 대상.
 * 403(VAPID 불일치)·429(rate limit)·5xx 등은 일시 오류로 보존한다.
 * (헬퍼를 webPush.ts가 아닌 여기 두는 이유: webPush.ts는 모듈 최상위에서
 *  setVapidDetails를 실행 → 테스트가 실제 헬퍼 로드 시 VAPID 검증 크래시.
 *  WebPushError 클래스 import는 부수효과가 없어 안전하다.)
 */
function isExpiredSubscriptionError(err: unknown): err is WebPushError {
  return (
    err instanceof WebPushError &&
    (err.statusCode === 404 || err.statusCode === 410)
  );
}

export type NotificationPayload = {
  title: string;
  body: string;
  /** 푸시 클릭 이동 경로(SW notificationclick) + 메일 링크. 인앱 알림함은 별도 파생. */
  url?: string;
  category: NotificationCategory;
  /** 인앱 알림함 그룹핑용 (Phase 2). */
  meetingId?: string;
  /** 기본 false. 송금 독촉만 true — 푸시 실패 시 메일 fallback. */
  emailFallback?: boolean;
};

export type SendResult =
  | { ok: true; channel: 'push' | 'email' }
  | { ok: false; reason: 'no_target' | 'opted_out' | 'no_channel' };

/**
 * userId(회원) 대상에게 알림 1건 발송. 웹푸시 우선 → 실패/구독없음 + emailFallback일 때만 메일.
 *
 * - 마스터 토글(`pushEnabled`)만 여기서 가드한다. 카테고리별 토글(예: 독촉의
 *   `paymentReminderEnabled`)은 호출부(트리거)가 적재 전에 검사한다.
 * - 도메인 정책(쿨다운/횟수/상태 재확인)은 이 함수가 모른다 — 순수 발송만 담당.
 * - 게스트(users 미존재)는 userId가 없으므로 호출부에서 걸러진다.
 */
export async function sendNotificationToUser(
  userId: string,
  payload: NotificationPayload
): Promise<SendResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { pushSubscriptions: true },
  });

  if (!user) return { ok: false, reason: 'no_target' };
  if (!user.pushEnabled) return { ok: false, reason: 'opted_out' };

  let pushSucceeded = false;
  const expiredSubIds: string[] = [];
  for (const sub of user.pushSubscriptions) {
    try {
      await sendWebPush(
        {
          endpoint: sub.endpoint,
          p256dhKey: sub.p256dhKey,
          authKey: sub.authKey,
        },
        { title: payload.title, body: payload.body, url: payload.url }
      );
      pushSucceeded = true;
    } catch (err) {
      if (isExpiredSubscriptionError(err)) {
        expiredSubIds.push(sub.id);
        console.warn(
          `[notification] expired sub removed sub=${sub.id} status=${err.statusCode}`
        );
      } else {
        console.error(`[notification] webpush failed sub=${sub.id}`, err);
      }
    }
  }

  // 만료 구독 정리 — best-effort. 정리 실패가 발송 결과·이메일 fallback을 막지 않는다.
  if (expiredSubIds.length > 0) {
    try {
      await prisma.pushSubscription.deleteMany({
        where: { id: { in: expiredSubIds } },
      });
    } catch (err) {
      console.error('[notification] expired sub cleanup failed', err);
    }
  }

  if (pushSucceeded) return { ok: true, channel: 'push' };

  if (payload.emailFallback && user.email) {
    await sendNotificationEmail({
      to: user.email,
      title: payload.title,
      body: payload.body,
      url: payload.url,
    });
    return { ok: true, channel: 'email' };
  }

  return { ok: false, reason: 'no_channel' };
}
