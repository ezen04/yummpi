'use client';

import { useState } from 'react';
import { Check } from '@yummpi/ui';
import { Toggle } from '@/components/common/Toggle';
import { usePushSubscription } from '../hooks/usePushSubscription';

interface Props {
  initialPushEnabled: boolean;
  initialPaymentReminderEnabled: boolean;
  appInstalled?: boolean;
  pushPermissionGranted?: boolean;
}

export function NotificationSettingsForm({
  initialPushEnabled,
  initialPaymentReminderEnabled,
  appInstalled = true,
  pushPermissionGranted = true,
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
      if (field === 'pushEnabled' && value) {
        const result = await subscribe();
        if (!result.ok) {
          setPushEnabled(false);
          setError(result.error ?? '알림 설정에 실패했어요.');
          return;
        }
      }

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
    <div className="flex flex-col gap-2">
      <div className="bg-[var(--bg-normal)] rounded-2xl overflow-hidden divide-y divide-[var(--line-alternative)]">
        <ToggleRow
          label="송금 독촉 알림"
          description="미송금 알림 받기"
          checked={paymentReminderEnabled}
          onChange={(v) => handleToggle('paymentReminderEnabled', v)}
        />
        <ToggleRow
          label="모임 활동 알림"
          description="투표·예약·정산 알림"
          checked={pushEnabled}
          onChange={(v) => handleToggle('pushEnabled', v)}
        />
        <StatusRow
          label="앱 설치"
          active={appInstalled}
          activeText="설치됨"
          inactiveText="미설치"
        />
        <StatusRow
          label="푸시 권한"
          active={pushPermissionGranted}
          activeText="허용됨"
          inactiveText="차단됨"
        />
      </div>
      {error && (
        <p className="text-[13px] text-[var(--status-negative)] px-1">
          {error}
        </p>
      )}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="px-4 py-3.5 flex items-center justify-between">
      <div className="flex flex-col gap-0.5">
        <span className="text-[15px] font-medium text-[var(--label-normal)]">
          {label}
        </span>
        <span className="text-[13px] text-[var(--label-alternative)]">
          {description}
        </span>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

function StatusRow({
  label,
  active,
  activeText,
  inactiveText,
}: {
  label: string;
  active: boolean;
  activeText: string;
  inactiveText: string;
}) {
  return (
    <div className="px-4 py-3.5 flex items-center justify-between">
      <span className="text-[15px] font-medium text-[var(--label-normal)]">
        {label}
      </span>
      <span
        className={
          active
            ? 'inline-flex items-center gap-1 text-[13px] text-[var(--status-positive)]'
            : 'text-[13px] text-[var(--label-assistive)]'
        }
      >
        {active && <Check size={16} />}
        {active ? activeText : inactiveText}
      </span>
    </div>
  );
}
