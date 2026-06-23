'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@yummpi/ui';
import { Input } from '@/components/common/Input';
import { Toggle } from '@/components/common/Toggle';
import { useCreateMeeting } from '../hooks';
import {
  isMeetingApiError,
  type CreateMeetingInput,
  type CreateMeetingResult,
} from '../api/meetingApi';

// 숫자 입력(빈 값 → undefined, 그 외 양의 정수만)을 파싱.
function parsePositiveInt(value: string): number | undefined {
  if (value.trim() === '') return undefined;
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) return NaN; // 검증 실패 신호
  return n;
}

export function CreateMeetingForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [maxMembers, setMaxMembers] = useState('');
  const [budgetPerPerson, setBudgetPerPerson] = useState('');
  const [anonymousVoting, setAnonymousVoting] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreateMeetingResult | null>(null);
  const [copied, setCopied] = useState(false);

  const create = useCreateMeeting();

  const submit = () => {
    setError(null);

    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 1 || trimmedTitle.length > 100) {
      setError('모임 이름을 1~100자로 입력해 주세요.');
      return;
    }

    const max = parsePositiveInt(maxMembers);
    if (Number.isNaN(max)) {
      setError('정원은 1 이상의 정수로 입력해 주세요.');
      return;
    }
    const budget = parsePositiveInt(budgetPerPerson);
    if (Number.isNaN(budget)) {
      setError('1인 예산은 1 이상의 정수로 입력해 주세요.');
      return;
    }

    const input: CreateMeetingInput = {
      title: trimmedTitle,
      anonymousVoting,
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(scheduledAt
        ? { scheduledAt: new Date(scheduledAt).toISOString() }
        : {}),
      ...(max ? { maxMembers: max } : {}),
      ...(budget ? { budgetPerPerson: budget } : {}),
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

  // 생성 완료 → 초대 링크 공유 화면 (결정: 성공 화면 + 초대링크 복사)
  if (created) {
    return (
      <main
        className="min-h-screen flex flex-col justify-between px-6 py-12"
        style={{ background: 'var(--bg-alternative)' }}
      >
        <div className="flex flex-1 flex-col justify-center gap-6">
          <div className="space-y-2 text-center">
            <h1
              className="text-2xl font-bold"
              style={{ color: 'var(--primary)' }}
            >
              모임이 만들어졌어요!
            </h1>
            <p style={{ color: 'var(--label-alternative)' }}>
              아래 링크를 친구들에게 공유해 초대하세요.
            </p>
          </div>

          <div
            className="rounded-2xl p-5 space-y-3"
            style={{
              background: 'var(--bg-normal)',
              border: '1px solid var(--line-normal)',
            }}
          >
            <p
              className="text-sm font-medium"
              style={{ color: 'var(--label-normal)' }}
            >
              {created.title}
            </p>
            <p
              className="text-sm break-all"
              style={{ color: 'var(--label-alternative)' }}
            >
              {created.inviteUrl}
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={copyInviteUrl}
            >
              {copied ? '복사됨!' : '초대 링크 복사'}
            </Button>
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

        <Link href={`/meetings/${created.id}`} className="w-full">
          <Button className="w-full">모임으로 이동</Button>
        </Link>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen flex flex-col justify-between px-6 py-10"
      style={{ background: 'var(--bg-alternative)' }}
    >
      <div className="flex flex-col gap-6">
        <h1
          className="text-2xl font-bold"
          style={{ color: 'var(--label-normal)' }}
        >
          모임 만들기
        </h1>

        <div className="flex flex-col gap-5">
          <Input
            label="모임 이름"
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
              className="w-full rounded-[12px] px-4 py-3 text-[15px] resize-none outline-none"
              style={{
                background: 'var(--bg-normal)',
                border: '1px solid var(--line-normal)',
                color: 'var(--label-normal)',
              }}
            />
          </div>

          <Input
            label="일시"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
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

          <Input
            label="1인 예산 (원)"
            type="number"
            inputMode="numeric"
            min={1}
            value={budgetPerPerson}
            onChange={(e) => {
              setBudgetPerPerson(e.target.value);
              if (error) setError(null);
            }}
            placeholder="예: 20000 (선택)"
          />

          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span
                className="text-[15px] font-medium"
                style={{ color: 'var(--label-normal)' }}
              >
                익명 투표
              </span>
              <span
                className="text-[13px]"
                style={{ color: 'var(--label-alternative)' }}
              >
                누가 어디에 투표했는지 숨겨요
              </span>
            </div>
            <Toggle checked={anonymousVoting} onChange={setAnonymousVoting} />
          </div>

          {error && (
            <p className="text-sm" style={{ color: 'var(--status-negative)' }}>
              {error}
            </p>
          )}
        </div>
      </div>

      <Button
        className="w-full mt-8"
        onClick={submit}
        disabled={create.isPending}
      >
        {create.isPending ? '만드는 중…' : '모임 만들기'}
      </Button>
    </main>
  );
}
