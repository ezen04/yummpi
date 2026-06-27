'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Check } from '@yummpi/ui';
import { Header } from '@/components/common/Header';
import { Input } from '@/components/common/Input';
import { ScheduleField } from './ScheduleField';
import { useCreateMeeting, useUpdateMeeting } from '../hooks';
import {
  isMeetingApiError,
  type CreateMeetingInput,
  type CreateMeetingResult,
} from '../api/meetingApi';

const WD = ['일', '월', '화', '수', '목', '금', '토'];

// 모임 일시 Date → "6.13 (금) 19:00"
function formatSchedule(d: Date | null): string | null {
  if (!d) return null;
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getMonth() + 1}.${d.getDate()} (${WD[d.getDay()]}) ${d.getHours()}:${mm}`;
}

// 숫자 입력(빈 값 → undefined, 그 외 양의 정수만)을 파싱.
function parsePositiveInt(value: string): number | undefined {
  if (value.trim() === '') return undefined;
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) return NaN; // 검증 실패 신호
  return n;
}

export interface MeetingFormInitial {
  title: string;
  description: string;
  scheduledAt: string | null; // ISO 문자열
  maxMembers: string;
}

interface CreateMeetingFormProps {
  mode?: 'create' | 'edit';
  meetingId?: string;
  initial?: MeetingFormInitial;
}

export function CreateMeetingForm({
  mode = 'create',
  meetingId,
  initial,
}: CreateMeetingFormProps = {}) {
  const router = useRouter();
  const isEdit = mode === 'edit';

  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [scheduledAt, setScheduledAt] = useState<Date | null>(
    initial?.scheduledAt ? new Date(initial.scheduledAt) : null
  );
  const [maxMembers, setMaxMembers] = useState(initial?.maxMembers ?? '');

  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreateMeetingResult | null>(null);
  const [copied, setCopied] = useState(false);

  const create = useCreateMeeting();
  const update = useUpdateMeeting(meetingId ?? '');

  const submit = () => {
    setError(null);

    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 1 || trimmedTitle.length > 100) {
      setError('모임 이름을 1~100자로 입력해 주세요.');
      return;
    }

    if (!scheduledAt) {
      setError('일시를 선택해 주세요.');
      return;
    }

    const max = parsePositiveInt(maxMembers);
    if (Number.isNaN(max)) {
      setError('정원은 1 이상의 정수로 입력해 주세요.');
      return;
    }

    // 수정 모드: PATCH → 성공 시 허브 복귀(+서버 컴포넌트 갱신).
    if (isEdit && meetingId) {
      update.mutate(
        {
          title: trimmedTitle,
          description: description.trim(), // 빈 문자열 → 소개 삭제 허용
          scheduledAt: scheduledAt.toISOString(),
          ...(max ? { maxMembers: max } : {}),
        },
        {
          onSuccess: () => {
            router.push(`/meetings/${meetingId}`);
            router.refresh();
          },
          onError: (err) => {
            setError(
              isMeetingApiError(err)
                ? err.message
                : '모임 수정에 실패했어요. 잠시 후 다시 시도해 주세요.'
            );
          },
        }
      );
      return;
    }

    const input: CreateMeetingInput = {
      title: trimmedTitle,
      // MVP는 투표를 익명으로만 운영 — 기본값 익명 고정(추후 확장 대비 필드 유지).
      anonymousVoting: true,
      scheduledAt: scheduledAt.toISOString(),
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(max ? { maxMembers: max } : {}),
    };

    create.mutate(input, {
      onSuccess: (res) => setCreated(res),
      onError: (err) => {
        if (isMeetingApiError(err)) {
          setError(err.message);
          return;
        }
        setError('모임 생성에 실패했어요. 잠시 후 다시 시도해 주세요.');
      },
    });
  };

  const copyInviteUrl = async () => {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('링크 복사에 실패했어요. 직접 복사해 주세요.');
    }
  };

  // 생성 완료 → 초대 링크 공유 화면
  if (created) {
    const date = formatSchedule(scheduledAt);
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{ background: 'var(--bg-alternative)' }}
      >
        <Header
          onBack={() => router.push('/dashboard')}
          onClose={() => router.push('/dashboard')}
        />

        <main className="flex-1 w-full max-w-[390px] mx-auto px-5 flex flex-col">
          <div className="flex flex-1 flex-col justify-center gap-6">
            {/* 성공 아이콘 + 카피 */}
            <div className="flex flex-col items-center gap-3 text-center">
              <div
                className="flex items-center justify-center w-16 h-16 rounded-[var(--radius-full)]"
                style={{ background: 'var(--primary-tint)' }}
              >
                <Check size={32} strokeWidth={2} color="var(--primary)" />
              </div>
              <div className="space-y-1">
                <h1
                  className="text-[22px] leading-[30px] font-bold"
                  style={{ color: 'var(--label-normal)' }}
                >
                  모임이 만들어졌어요
                </h1>
                <p
                  className="text-[14px]"
                  style={{ color: 'var(--label-alternative)' }}
                >
                  초대 링크를 공유하고 친구들을 모아보세요
                </p>
              </div>
            </div>

            {/* 모임 정보 카드 */}
            <div
              className="flex flex-col gap-1.5 p-4"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--line-alternative)',
                borderRadius: 'var(--radius-12)',
                boxShadow: 'var(--shadow-small)',
              }}
            >
              <span
                className="text-[16px] font-semibold"
                style={{ color: 'var(--label-normal)' }}
              >
                {created.title}
              </span>
              {date && (
                <span
                  className="text-[13px]"
                  style={{ color: 'var(--label-alternative)' }}
                >
                  {date}
                </span>
              )}
            </div>

            {/* 초대 링크 + 복사 */}
            <div
              className="flex items-center gap-2 py-1.5 pl-4 pr-1.5"
              style={{
                background: 'var(--bg-alternative)',
                border: '1px solid var(--line-normal)',
                borderRadius: 'var(--radius-12)',
              }}
            >
              <span
                className="flex-1 min-w-0 truncate text-[14px]"
                style={{ color: 'var(--label-neutral)' }}
              >
                {created.inviteUrl}
              </span>
              <button
                onClick={copyInviteUrl}
                className="shrink-0 inline-flex items-center gap-1 h-9 px-3 rounded-[var(--radius-8)] text-[13px] font-medium cursor-pointer"
                style={{
                  background: 'var(--bg-normal)',
                  border: '1px solid var(--line-neutral)',
                  color: 'var(--label-normal)',
                }}
              >
                <Check size={16} strokeWidth={2} />
                {copied ? '복사됨' : '복사'}
              </button>
            </div>

            {error && (
              <p
                className="text-center text-sm"
                style={{ color: 'var(--status-negative)' }}
              >
                {error}
              </p>
            )}
          </div>

          <Link href={`/meetings/${created.id}`} className="w-full pt-4 pb-8">
            <Button className="w-full">모임으로 이동</Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--bg-alternative)' }}
    >
      <Header
        onBack={() =>
          isEdit && meetingId
            ? router.push(`/meetings/${meetingId}`)
            : router.back()
        }
        title={isEdit ? '모임 수정' : '새 모임 만들기'}
      />

      <main className="flex-1 w-full max-w-[390px] mx-auto px-5 flex flex-col justify-between pb-8">
        <div className="flex flex-col gap-5 pt-2">
          <Input
            label="모임명"
            required
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError(null);
            }}
            maxLength={100}
            placeholder="예: 동기 모임 저녁"
          />

          {/* 소개 (선택) */}
          <div className="flex flex-col gap-[6px] w-full">
            <label
              className="text-[14px] leading-5 font-medium"
              style={{ color: 'var(--label-normal)' }}
            >
              소개
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="모임 소개를 적어주세요 (선택)"
              className="w-full px-4 py-3 text-[15px] resize-none outline-none"
              style={{
                background: 'var(--bg-normal)',
                border: '1px solid var(--line-normal)',
                borderRadius: 'var(--radius-12)',
                color: 'var(--label-normal)',
              }}
            />
          </div>

          <ScheduleField
            label="일시"
            required
            value={scheduledAt}
            onChange={(d) => {
              setScheduledAt(d);
              if (error) setError(null);
            }}
            error={!!error && !scheduledAt}
          />

          <Input
            label="정원"
            type="number"
            inputMode="numeric"
            min={1}
            value={maxMembers}
            onChange={(e) => {
              setMaxMembers(e.target.value);
              if (error) setError(null);
            }}
            placeholder="예: 6 (선택)"
          />

          {error && (
            <p className="text-sm" style={{ color: 'var(--status-negative)' }}>
              {error}
            </p>
          )}
        </div>

        <Button
          className="w-full mt-8"
          onClick={submit}
          disabled={isEdit ? update.isPending : create.isPending}
        >
          {isEdit
            ? update.isPending
              ? '저장 중…'
              : '수정 완료'
            : create.isPending
              ? '만드는 중…'
              : '모임 만들기'}
        </Button>
      </main>
    </div>
  );
}
