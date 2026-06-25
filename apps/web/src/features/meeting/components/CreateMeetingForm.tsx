'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Check } from '@yummpi/ui';
import { Header } from '@/components/common/Header';
import { Input } from '@/components/common/Input';
import { Toggle } from '@/components/common/Toggle';
import { useCreateMeeting } from '../hooks';
import {
  isMeetingApiError,
  type CreateMeetingInput,
  type CreateMeetingResult,
} from '../api/meetingApi';

const WD = ['일', '월', '화', '수', '목', '금', '토'];

// datetime-local 입력값 → "6.13 (금) 19:00"
function formatSchedule(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return null;
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

export function CreateMeetingForm() {
  const router = useRouter();
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
      <Header onBack={() => router.back()} title="새 모임 만들기" />

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

        <Button
          className="w-full mt-8"
          onClick={submit}
          disabled={create.isPending}
        >
          {create.isPending ? '만드는 중…' : '모임 만들기'}
        </Button>
      </main>
    </div>
  );
}
