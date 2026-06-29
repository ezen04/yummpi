'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, toast } from '@yummpi/ui';
import { Header } from '@/components/common/Header';
import { YAvatar } from '@/components/common/YAvatar';
import { setAttendance, isMeetingApiError } from '../api/meetingApi';

export interface AttendMember {
  id: string;
  nickname: string;
  isHost: boolean;
  isGuest: boolean;
}

interface Props {
  meetingId: string;
  title: string;
  members: AttendMember[];
}

export function AttendanceView({ meetingId, members }: Props) {
  const router = useRouter();
  // 기본 전원 참석. 호스트는 항상 참석(토글 불가, 정산 흡수자).
  const [attending, setAttending] = useState<Set<string>>(
    () => new Set(members.map((m) => m.id))
  );
  const [pending, setPending] = useState(false);

  const attendCount = attending.size;
  const absentCount = members.length - attendCount;

  const toggle = (m: AttendMember) => {
    if (m.isHost) return;
    setAttending((prev) => {
      const next = new Set(prev);
      if (next.has(m.id)) next.delete(m.id);
      else next.add(m.id);
      return next;
    });
  };

  const allOn = () => setAttending(new Set(members.map((m) => m.id)));

  const start = async () => {
    setPending(true);
    try {
      await setAttendance(meetingId, [...attending]);
      router.push(`/meetings/${meetingId}/settlement/new`);
    } catch (e) {
      toast.error(
        isMeetingApiError(e) ? e.message : '참석자 확정에 실패했어요.'
      );
      setPending(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg-alternative)]">
      <Header
        title="참석 체크"
        subtitle={`${attendCount}명 참석 예정`}
        onBack={() => router.back()}
      />

      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-[14px] text-[var(--label-alternative)]">
            정산 대상이 될 참석자를 확정해요.
          </p>
          <button
            type="button"
            onClick={allOn}
            className="shrink-0 border-none bg-transparent text-[13px] font-medium text-[var(--primary)] cursor-pointer"
          >
            전체 참석
          </button>
        </div>

        <ul className="flex flex-col gap-2">
          {members.map((m) => {
            const on = attending.has(m.id);
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => toggle(m)}
                  disabled={m.isHost}
                  className="w-full flex items-center gap-3 rounded-[var(--radius-12)] bg-[var(--bg-normal)] px-4 py-3 text-left disabled:cursor-default"
                >
                  <YAvatar
                    variant={m.isHost ? 'host' : 'guest'}
                    name={m.nickname}
                    size={40}
                  />
                  <span className="flex-1 min-w-0 truncate text-[15px] font-medium text-[var(--label-normal)]">
                    {m.nickname}
                  </span>
                  {m.isHost ? (
                    <RoleBadge label="주최자" tone="primary" />
                  ) : m.isGuest ? (
                    <RoleBadge label="게스트" tone="neutral" />
                  ) : null}
                  <span
                    className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full"
                    style={{
                      background: on ? 'var(--primary)' : 'transparent',
                      border: on ? 'none' : '1.5px solid var(--line-normal)',
                    }}
                  >
                    {on && (
                      <Check
                        size={14}
                        strokeWidth={3}
                        color="var(--static-white)"
                      />
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="shrink-0 border-t border-[var(--line-alternative)] bg-[var(--bg-normal)] px-5 pt-3 pb-[max(20px,env(safe-area-inset-bottom))] flex flex-col gap-3">
        <p className="text-center text-[13px] text-[var(--label-alternative)]">
          참석 {attendCount}명 · 불참 {absentCount}명
        </p>
        <button
          type="button"
          onClick={start}
          disabled={pending}
          className="h-12 w-full rounded-[var(--radius-12)] bg-[var(--primary)] text-[16px] font-semibold text-[var(--static-white)] border-none cursor-pointer disabled:opacity-60"
        >
          {pending ? '시작하는 중…' : '정산 시작하기'}
        </button>
      </div>
    </div>
  );
}

function RoleBadge({
  label,
  tone,
}: {
  label: string;
  tone: 'primary' | 'neutral';
}) {
  return (
    <span
      className="shrink-0 rounded-full px-2 py-0.5 text-[12px] font-medium"
      style={
        tone === 'primary'
          ? { background: 'var(--primary-tint)', color: 'var(--primary)' }
          : {
              background: 'var(--fill-normal)',
              color: 'var(--label-alternative)',
            }
      }
    >
      {label}
    </span>
  );
}
