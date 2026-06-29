'use client';

import { useSession } from 'next-auth/react';
import { useInviteInfo } from '../hooks';
import { JoinBlockedView } from '../components/JoinBlockedView';
import { GuestJoinForm } from '../components/GuestJoinForm';
import { MemberJoinView } from '../components/MemberJoinView';

export function JoinPage({ inviteCode }: { inviteCode: string }) {
  const { data, isLoading, isError } = useInviteInfo(inviteCode);
  const { data: session, status } = useSession();

  if (isLoading || status === 'loading') {
    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center px-5"
        style={{ background: 'var(--bg-alternative)' }}
      >
        <div
          className="w-full max-w-[390px] flex flex-col gap-4 p-6 rounded-[var(--radius-12)]"
          style={{ background: 'var(--bg-normal)' }}
        >
          <div className="h-6 w-2/3 mx-auto rounded-[var(--radius-8)] bg-[var(--fill-normal)] animate-pulse" />
          <div className="h-[72px] w-full rounded-[var(--radius-12)] bg-[var(--fill-normal)] animate-pulse" />
          <div className="h-12 w-full rounded-[var(--radius-12)] bg-[var(--fill-normal)] animate-pulse" />
          <div className="h-12 w-full rounded-[var(--radius-12)] bg-[var(--fill-normal)] animate-pulse" />
        </div>
      </main>
    );
  }

  // 잘못된 코드·미존재 등 → 차단
  if (isError || !data) {
    return <JoinBlockedView reason="INVALID" />;
  }

  if (data.expired || data.status === 'CANCELLED') {
    return <JoinBlockedView reason="EXPIRED" />;
  }
  if (data.status === 'COMPLETED') {
    return <JoinBlockedView reason="COMPLETED" />;
  }

  // 로그인 회원 → 세션 닉네임 기반 member 입장. 비로그인 → 게스트 입장.
  if (status === 'authenticated') {
    return (
      <MemberJoinView
        inviteCode={inviteCode}
        info={data}
        sessionNickname={session?.user?.nickname ?? session?.user?.name ?? null}
      />
    );
  }

  return <GuestJoinForm inviteCode={inviteCode} info={data} />;
}
