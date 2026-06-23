'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check } from '@yummpi/ui';
import { Toggle } from '@/components/common/Toggle';
import { usePushSubscription } from '../hooks/usePushSubscription';
import { useAppInstalled } from '../hooks/useAppInstalled';
import { usePushPermission } from '../hooks/usePushPermission';

interface UserSettings {
  pushEnabled: boolean;
  paymentReminderEnabled: boolean;
}

const USER_SETTINGS_KEY = ['user', 'me'] as const;

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

function extractData<T>(envelope: ApiEnvelope<T>): T {
  if (!envelope.success || !envelope.data) {
    throw new Error(envelope.error?.message ?? 'API error');
  }
  return envelope.data;
}

async function getUserSettings(): Promise<UserSettings> {
  const res = await fetch('/api/v1/users/me');
  if (!res.ok) throw new Error('Failed to fetch user settings');
  const envelope = (await res.json()) as ApiEnvelope<UserSettings>;
  const data = extractData(envelope);
  return {
    pushEnabled: data.pushEnabled,
    paymentReminderEnabled: data.paymentReminderEnabled,
  };
}

async function patchUserSettings(
  patch: Partial<UserSettings>
): Promise<UserSettings> {
  const res = await fetch('/api/v1/users/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error('Failed to patch user settings');
  const envelope = (await res.json()) as ApiEnvelope<UserSettings>;
  const data = extractData(envelope);
  return {
    pushEnabled: data.pushEnabled,
    paymentReminderEnabled: data.paymentReminderEnabled,
  };
}

export function NotificationSettingsForm() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: USER_SETTINGS_KEY,
    queryFn: getUserSettings,
    staleTime: 60_000,
  });

  const appInstalled = useAppInstalled();
  const { granted: pushPermissionGranted, refresh: refreshPushPermission } =
    usePushPermission();
  const { subscribe, unsubscribe } = usePushSubscription();
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: patchUserSettings,
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: USER_SETTINGS_KEY });
      const previous =
        queryClient.getQueryData<UserSettings>(USER_SETTINGS_KEY);
      queryClient.setQueryData<UserSettings>(USER_SETTINGS_KEY, (old) =>
        old ? { ...old, ...patch } : old
      );
      return { previous };
    },
    onError: (_err, _patch, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(USER_SETTINGS_KEY, ctx.previous);
      }
      setError('설정 변경에 실패했습니다. 다시 시도해주세요.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: USER_SETTINGS_KEY });
    },
  });

  async function handleToggle(
    field: 'pushEnabled' | 'paymentReminderEnabled',
    value: boolean
  ) {
    setError(null);

    if (field === 'pushEnabled' && value) {
      const result = await subscribe();
      if (!result.ok) {
        setError(result.error ?? '알림 설정에 실패했어요.');
        return;
      }
      refreshPushPermission();
    }

    if (field === 'pushEnabled' && !value) {
      const result = await unsubscribe();
      if (!result.ok) {
        setError(result.error ?? '알림 해제에 실패했어요.');
        return;
      }
    }

    mutation.mutate({ [field]: value });
  }

  if (isLoading || !data) {
    return <SkeletonCard />;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="bg-[var(--bg-normal)] rounded-2xl overflow-hidden divide-y divide-[var(--line-alternative)]">
        <ToggleRow
          label="송금 독촉 알림"
          description="미송금 알림 받기"
          checked={data.paymentReminderEnabled}
          onChange={(v) => handleToggle('paymentReminderEnabled', v)}
        />
        <ToggleRow
          label="모임 활동 알림"
          description="투표·예약·정산 알림"
          checked={data.pushEnabled}
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

function SkeletonCard() {
  return (
    <div className="bg-[var(--bg-normal)] rounded-2xl overflow-hidden divide-y divide-[var(--line-alternative)]">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="px-4 py-3.5 h-[60px] animate-pulse" />
      ))}
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
