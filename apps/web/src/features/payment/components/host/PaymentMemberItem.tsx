'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/common/Button';
import { formatAmount } from '../../utils/transferMock';
import { PaymentConfirmbox } from '../shell/PaymentConfirmbox';
import '../payment-montage.css';
import { REMIND_DAILY_LIMIT } from '@yummpi/schemas';
import type { PaymentListItem, PaymentAction } from '@yummpi/schemas';

/** 남은 ms → 카운트다운 표기 (mm:ss, 1시간 이상이면 h:mm:ss) */
function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

type Props = {
  item: PaymentListItem;
  viewerRole: 'HOST' | 'MEMBER';
  onAction?: (paymentId: string, action: PaymentAction) => void;
};

const STATUS_BADGE: Record<
  string,
  { label: string; className: string } | null
> = {
  PAID: {
    label: '완료',
    className:
      'text-[var(--status-positive)] border border-[var(--status-positive)]',
  },
  EXEMPT: {
    label: '면제',
    className:
      'text-[var(--label-alternative)] border border-[var(--line-normal)]',
  },
  TRANSFER_REPORTED: null,
  PENDING: null,
};

export function PaymentMemberItem({ item, viewerRole, onAction }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const badge = STATUS_BADGE[item.status] ?? null;
  const isHost = viewerRole === 'HOST';
  const isHostSelf = item.isMine && isHost;
  // 쿨다운: 마운트 후에만 시각 비교(SSR 불일치 방지). 1초마다 갱신해
  // 라이브 카운트다운을 그리고, 만료되면 폴링/새로고침 없이 버튼이 자동으로 풀린다.
  const [now, setNow] = useState(() => Date.now());
  const cooldownUntilMs = item.remindCooldownUntil
    ? new Date(item.remindCooldownUntil).getTime()
    : null;
  const isCooldown = cooldownUntilMs !== null && cooldownUntilMs > now;
  const remindRemaining = Math.max(0, REMIND_DAILY_LIMIT - item.remindCount);
  const isRemindLimitReached = remindRemaining === 0;

  useEffect(() => {
    if (cooldownUntilMs === null || cooldownUntilMs <= Date.now()) return;
    // 쿨다운 활성화 시점에 now를 즉시 동기화(effect 본문 직접 setState 회피 → rAF).
    const raf = requestAnimationFrame(() => setNow(Date.now()));
    // 1초마다 갱신 → mm:ss 라이브 카운트다운 + 만료 시 자동 해제.
    const timer = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= cooldownUntilMs) clearInterval(timer);
    }, 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(timer);
    };
  }, [cooldownUntilMs]);

  return (
    <>
      <div className="flex items-center gap-3 px-5 h-[68px]">
        {/* 아바타 — C-2: 44px */}
        <div className="w-11 h-11 rounded-full bg-[var(--bg-alternative)] flex items-center justify-center text-sm font-semibold text-[var(--label-neutral)] shrink-0">
          {item.displayName[0]}
        </div>

        {/* 이름 + 금액 */}
        <div className="flex-1 flex flex-col justify-center min-w-0 gap-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-[var(--label-strong)] truncate">
              {item.displayName}
            </span>
            {/* C-3: 게스트 뱃지 업그레이드 */}
            {item.isGuest && (
              <span className="shrink-0 text-[12px] font-semibold px-2 py-0.5 rounded-full bg-[var(--fill-normal)] text-[var(--label-alternative)]">
                게스트
              </span>
            )}
            {isHostSelf && (
              <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                주최자
              </span>
            )}
            {item.isMine && (
              <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[var(--fill-normal)] text-[var(--label-neutral)]">
                나
              </span>
            )}
          </div>
          <span className="text-xs text-[var(--label-alternative)]">
            {isHostSelf
              ? `선결제 · ${formatAmount(item.amount)}`
              : formatAmount(item.amount)}
          </span>
        </div>

        {/* 오른쪽: 배지 또는 액션 버튼 — C-5: h-10 (40px) */}
        <div className="shrink-0 flex items-center gap-1.5">
          {badge && (
            <span
              className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${badge.className}`}
            >
              {badge.label}
            </span>
          )}

          {/* EXEMPT → 면제 취소 (배지와 함께 노출) */}
          {item.status === 'EXEMPT' && item.canMarkPending && onAction && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAction(item.paymentId, 'MARK_PENDING')}
              className="rounded-full h-10 px-[18px] text-[15px] font-medium text-[var(--label-alternative)] whitespace-nowrap"
            >
              면제 취소
            </Button>
          )}

          {!badge && onAction && (
            <>
              {/* TRANSFER_REPORTED → 완료 확인 */}
              {item.canMarkPaid && (
                <Button
                  variant="basic"
                  size="sm"
                  onClick={() => setConfirmOpen(true)}
                  className="rounded-full h-10 px-[18px] text-[15px] whitespace-nowrap"
                >
                  완료 확인
                </Button>
              )}

              {/* PAID → 되돌리기 */}
              {item.canMarkPending && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAction(item.paymentId, 'MARK_PENDING')}
                  className="rounded-full h-10 px-[18px] text-[15px] font-medium text-[var(--label-alternative)] whitespace-nowrap"
                >
                  되돌리기
                </Button>
              )}

              {/* PENDING → 독촉 (회원만, 쿨다운 중 비활성) */}
              {isHost &&
                !isHostSelf &&
                item.status === 'PENDING' &&
                !item.isGuest && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-[var(--label-alternative)] whitespace-nowrap [font-variant-numeric:tabular-nums]">
                      {isRemindLimitReached
                        ? '내일 다시 가능'
                        : isCooldown && cooldownUntilMs !== null
                          ? `${formatCountdown(cooldownUntilMs - now)}`
                          : `오늘 ${remindRemaining}회 남음`}
                    </span>
                    <Button
                      variant="basic"
                      size="sm"
                      onClick={() => onAction(item.paymentId, 'REMIND')}
                      disabled={isCooldown || isRemindLimitReached}
                      className="rounded-full h-10 px-[18px] text-[15px] whitespace-nowrap gap-1.5"
                    >
                      독촉
                    </Button>
                  </div>
                )}

              {/* PENDING → 면제 */}
              {item.canMarkExempt && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAction(item.paymentId, 'MARK_EXEMPT')}
                  className="rounded-full h-10 px-[18px] text-[15px] font-medium text-[var(--label-alternative)] whitespace-nowrap"
                >
                  면제
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <PaymentConfirmbox
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          onAction?.(item.paymentId, 'MARK_PAID');
          setConfirmOpen(false);
        }}
        cancelLabel="아니요"
        confirmLabel="송금 확인"
      >
        <p className="mtg-body2 text-[var(--label-alternative)]">
          {item.displayName}님의 금액
        </p>
        <p className="text-[30px] font-bold tracking-[-0.5px] mt-1.5 mb-1 [font-variant-numeric:tabular-nums]">
          {`'${formatAmount(item.amount)}'`}
        </p>
        <p className="mtg-body2 text-[var(--label-alternative)]">
          입금이 확인되었나요?
        </p>
      </PaymentConfirmbox>
    </>
  );
}
