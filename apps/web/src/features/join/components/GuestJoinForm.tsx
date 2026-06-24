'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Button } from '@yummpi/ui';
import { useGuestJoin, useRandomNicknames } from '../hooks';
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

  const random = useRandomNicknames(3, true);
  const join = useGuestJoin();

  const suggestions = random.data ?? [];
  // 사용자가 입력하기 전에는 첫 추천 닉네임을 그대로 노출(effect 동기화 대신 파생값).
  const effectiveNickname = touched ? nickname : (suggestions[0] ?? '');

  const isFull =
    info.maxMembers !== null && info.memberCount >= info.maxMembers;

  const pickSuggestion = (s: string) => {
    setNickname(s);
    setTouched(true);
    if (error) setError(null);
  };

  const shuffle = () => {
    setTouched(false);
    setError(null);
    random.refetch();
  };

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
                setError(
                  `이미 쓰는 닉네임이에요. '${suggestion}'(으)로 바꿔봤어요.`
                );
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
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--primary)' }}
          >
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
          <div className="flex flex-col gap-2">
            <label className="px-1 text-[14px] font-medium text-[var(--label-normal)]">
              모임방에서 쓸 닉네임
            </label>

            <div className="relative">
              <input
                value={effectiveNickname}
                onChange={(e) => {
                  setTouched(true);
                  setNickname(e.target.value);
                  if (error) setError(null);
                }}
                maxLength={20}
                placeholder="모임에서 보일 이름"
                className="w-full h-12 pl-4 pr-[68px] rounded-[var(--radius-12)] border border-[var(--line-normal)] bg-[var(--bg-normal)] text-[15px] text-[var(--label-normal)] outline-none focus:border-[var(--primary)]"
              />
              <button
                type="button"
                onClick={shuffle}
                disabled={random.isFetching}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-3 rounded-full text-[13px] font-medium text-[var(--label-alternative)] bg-[var(--fill-normal)] border-none cursor-pointer transition-colors hover:bg-[var(--fill-strong)] disabled:opacity-60"
              >
                랜덤
              </button>
            </div>

            {/* 추천 닉네임 칩 */}
            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {suggestions.map((s) => {
                  const active = effectiveNickname === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => pickSuggestion(s)}
                      className="h-8 rounded-full border px-3 text-[13px] font-medium transition-colors"
                      style={
                        active
                          ? {
                              background: 'var(--primary-tint)',
                              color: 'var(--primary)',
                              borderColor: 'var(--primary)',
                            }
                          : {
                              background: 'transparent',
                              color: 'var(--label-alternative)',
                              borderColor: 'var(--line-normal)',
                            }
                      }
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            )}

            {error && (
              <p className="px-1 text-[13px] text-[var(--status-negative)]">
                {error}
              </p>
            )}
          </div>
        )}
      </div>

      {/* 하단: 입장 + 회원 전환 유도 */}
      <div className="flex w-full flex-col items-center gap-3">
        <Button
          className="w-full"
          onClick={submit}
          disabled={isFull || join.isPending}
        >
          {join.isPending ? '입장 중…' : '입장하기'}
        </Button>
        <button
          type="button"
          onClick={() =>
            signIn('kakao', { callbackUrl: `/join/${inviteCode}` })
          }
          className="bg-transparent text-[13px] text-[var(--label-alternative)] underline-offset-2 hover:underline border-none cursor-pointer"
        >
          내 모임으로 저장하려면 카카오 로그인
        </button>
      </div>
    </main>
  );
}
