'use client';

import { useState } from 'react';
import { Toggle } from '@/components/common/Toggle';
import { usePushSubscription } from '../hooks/usePushSubscription';

interface Props {
  initialPushEnabled: boolean;
  initialPaymentReminderEnabled: boolean;
}

export function NotificationSettingsForm({
  initialPushEnabled,
  initialPaymentReminderEnabled,
}: Props) {
  const [pushEnabled, setPushEnabled] = useState(initialPushEnabled);
  const [paymentReminderEnabled, setPaymentReminderEnabled] = useState(
    initialPaymentReminderEnabled
  );
  const [error, setError] = useState<string | null>(null);
  const { subscribe, unsubscribe } = usePushSubscription();

  async function handleToggle(
    field: 'pushEnabled' | 'paymentReminderEnabled',
    value: boolean
  ) {
    const prev = field === 'pushEnabled' ? pushEnabled : paymentReminderEnabled;

    if (field === 'pushEnabled') setPushEnabled(value);
    else setPaymentReminderEnabled(value);
    setError(null);

    try {
      // pushEnabled ON → 브라우저 권한 요청 + 웹푸시 구독 등록
      if (field === 'pushEnabled' && value) {
        const result = await subscribe();
        if (!result.ok) {
          setPushEnabled(false);
          setError(result.error ?? '알림 설정에 실패했어요.');
          return;
        }
      }

      // pushEnabled OFF → 웹푸시 구독 해제
      if (field === 'pushEnabled' && !value) {
        const result = await unsubscribe();
        if (!result.ok) {
          setPushEnabled(true);
          setError(result.error ?? '알림 해제에 실패했어요.');
          return;
        }
      }

      const res = await fetch('/api/v1/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error();
    } catch {
      if (field === 'pushEnabled') setPushEnabled(prev);
      else setPaymentReminderEnabled(prev);
      setError('설정 변경에 실패했습니다. 다시 시도해주세요.');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-[15px] font-medium text-[var(--label-normal)]">
            모임 활동 알림
          </span>
          <span className="text-[13px] text-[var(--label-alternative)]">
            투표·예약·정산 알림
          </span>
        </div>
        <Toggle
          checked={pushEnabled}
          onChange={(v) => handleToggle('pushEnabled', v)}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-[15px] font-medium text-[var(--label-normal)]">
            송금 독촉 알림
          </span>
          <span className="text-[13px] text-[var(--label-alternative)]">
            미송금 알림 받기
          </span>
        </div>
        <Toggle
          checked={paymentReminderEnabled}
          onChange={(v) => handleToggle('paymentReminderEnabled', v)}
        />
      </div>

      {error && (
        <p className="text-[13px] text-[var(--status-negative)]">{error}</p>
      )}
    </div>
  );
}
