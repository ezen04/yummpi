'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@yummpi/ui';
import { Input } from '@/components/common/Input';
import { useMemberJoin } from '../hooks';
import { isJoinApiError, type InviteInfo } from '../api/joinApi';

// 로그인 회원의 /join 입장 (결정#3): 세션 닉네임 기본, 같은 모임 내 충돌 시에만 입력.
export function MemberJoinView({
  inviteCode,
  info,
  sessionNickname,
}: {
  inviteCode: string;
  info: InviteInfo;
  sessionNickname: string | null;
}) {
  const router = useRouter();
  const join = useMemberJoin();
  const [needNickname, setNeedNickname] = useState(false);
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [joinedNickname, setJoinedNickname] = useState<string | null>(null);

  const submit = () => {
    setError(null);

    // 충돌 재입력 단계에서만 닉네임 명시. 그 외엔 서버가 세션 닉네임 사용.
    let explicit: string | undefined;
    if (needNickname) {
      const trimmed = nickname.trim();
      if (trimmed.length < 1 || trimmed.length > 20) {
        setError('닉네임은 1~20자로 입력해 주세요.');
        return;
      }
      explicit = trimmed;
    }

    join.mutate(
      { meetingId: info.id, inviteCode, nickname: explicit },
      {
        onSuccess: (res) => setJoinedNickname(res.nickname),
        onError: (err) => {
          if (isJoinApiError(err)) {
            // 이미 참여한 모임 → 그냥 허브로 보낸다.
            if (err.code === 'ALREADY_JOINED_MEETING') {
              router.push(`/meetings/${info.id}`);
              return;
            }
            if (err.code === 'NICKNAME_DUPLICATED') {
              const suggestion = (err.details as { suggestion?: string } | null)
                ?.suggestion;
              setNeedNickname(true);
              setNickname(suggestion ?? sessionNickname ?? '');
              setError(
                suggestion
                  ? `이미 쓰는 닉네임이에요. '${suggestion}'(으)로 바꿔봤어요.`
                  : '이미 사용 중인 닉네임이에요. 다른 닉네임을 입력해 주세요.'
              );
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

  const label = needNickname
    ? '이 닉네임으로 입장'
    : `${sessionNickname ?? '회원'} 님으로 입장하기`;

  return (
    <main
      className="min-h-screen flex flex-col justify-between px-6 py-12"
      style={{ background: 'var(--bg-alternative)' }}
    >
      <div className="flex flex-1 flex-col justify-center gap-6">
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
            <p className="text-sm" style={{ color: 'var(--label-alternative)' }}>
              {info.hostNickname} 님의 모임
            </p>
          )}
          <p className="text-sm" style={{ color: 'var(--label-assistive)' }}>
            현재 {info.memberCount}명 참여 중
            {info.maxMembers ? ` · 정원 ${info.maxMembers}명` : ''}
          </p>
        </div>

        {needNickname && (
          <Input
            label="닉네임"
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value);
              if (error) setError(null);
            }}
            maxLength={20}
            placeholder="모임에서 보일 이름"
            error={error ?? undefined}
          />
        )}
      </div>

      <Button className="w-full" onClick={submit} disabled={join.isPending}>
        {join.isPending ? '입장 중…' : label}
      </Button>
    </main>
  );
}
