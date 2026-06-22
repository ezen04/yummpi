'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@yummpi/ui';
import { Input } from '@/components/common/Input';
import { useGuestJoin, useRandomNickname } from '../hooks';
import { isJoinApiError, type InviteInfo } from '../api/joinApi';

export function GuestJoinForm({
  inviteCode,
  info,
}: {
  inviteCode: string;
  info: InviteInfo;
}) {
  const [nickname, setNickname] = useState('');
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinedNickname, setJoinedNickname] = useState<string | null>(null);

  const random = useRandomNickname(true);
  const join = useGuestJoin();

  // 사용자가 입력하기 전에는 랜덤 닉네임을 그대로 노출(effect 동기화 대신 파생값).
  const effectiveNickname = touched ? nickname : (random.data?.nickname ?? '');

  const isFull =
    info.maxMembers !== null && info.memberCount >= info.maxMembers;

  const submit = () => {
    setError(null);
    const trimmed = effectiveNickname.trim();
    if (trimmed.length < 1 || trimmed.length > 20) {
      setError('닉네임은 1~20자로 입력해 주세요.');
      return;
    }

    join.mutate(
      { meetingId: info.id, inviteCode, nickname: trimmed },
      {
        onSuccess: (res) => setJoinedNickname(res.nickname),
        onError: (err) => {
          if (isJoinApiError(err)) {
            if (err.code === 'NICKNAME_DUPLICATED') {
              const suggestion = (err.details as { suggestion?: string } | null)
                ?.suggestion;
              if (suggestion) {
                setNickname(suggestion);
                setTouched(true);
                setError(`이미 쓰는 닉네임이에요. '${suggestion}'(으)로 바꿔봤어요.`);
              } else {
                setError('이미 사용 중인 닉네임이에요.');
              }
              return;
            }
            setError(err.message);
            return;
          }
          setError('입장에 실패했어요. 잠시 후 다시 시도해 주세요.');
        },
      }
    );
  };

  // 입장 완료. 입장 후 상태별 라우팅(결정#4) 확정 전까지 자동 이동 대신 버튼 제공.
  if (joinedNickname) {
    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center"
        style={{ background: 'var(--bg-alternative)' }}
      >
        <div className="space-y-2">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>
            입장 완료!
          </h1>
          <p style={{ color: 'var(--label-alternative)' }}>
            {joinedNickname} 님으로 입장했어요.
          </p>
        </div>
        <Link href={`/meetings/${info.id}`} className="w-full max-w-xs">
          <Button className="w-full">모임으로 이동</Button>
        </Link>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen flex flex-col justify-between px-6 py-12"
      style={{ background: 'var(--bg-alternative)' }}
    >
      <div className="flex flex-1 flex-col justify-center gap-6">
        {/* 모임 정보 카드 */}
        <div
          className="rounded-2xl p-5 space-y-2"
          style={{
            background: 'var(--bg-normal)',
            border: '1px solid var(--line-normal)',
          }}
        >
          <h1
            className="text-xl font-bold"
            style={{ color: 'var(--label-normal)' }}
          >
            {info.title}
          </h1>
          {info.hostNickname && (
            <p
              className="text-sm"
              style={{ color: 'var(--label-alternative)' }}
            >
              {info.hostNickname} 님의 모임
            </p>
          )}
          <p className="text-sm" style={{ color: 'var(--label-assistive)' }}>
            현재 {info.memberCount}명 참여 중
            {info.maxMembers ? ` · 정원 ${info.maxMembers}명` : ''}
          </p>
        </div>

        {isFull ? (
          <p
            className="text-center text-sm"
            style={{ color: 'var(--status-negative)' }}
          >
            인원이 마감된 모임이에요.
          </p>
        ) : (
          <Input
            label="닉네임"
            value={effectiveNickname}
            onChange={(e) => {
              setTouched(true);
              setNickname(e.target.value);
              if (error) setError(null);
            }}
            maxLength={20}
            placeholder="모임에서 보일 이름"
            error={error ?? undefined}
          />
        )}
      </div>

      <Button
        className="w-full"
        onClick={submit}
        disabled={isFull || join.isPending}
      >
        {join.isPending ? '입장 중…' : '입장하기'}
      </Button>
    </main>
  );
}
