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
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-alternative)' }}
      >
        <p style={{ color: 'var(--label-assistive)' }}>불러오는 중…</p>
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
