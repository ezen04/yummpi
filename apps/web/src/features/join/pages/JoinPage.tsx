'use client';

import { useInviteInfo } from '../hooks';
import { JoinBlockedView } from '../components/JoinBlockedView';
import { GuestJoinForm } from '../components/GuestJoinForm';

export function JoinPage({ inviteCode }: { inviteCode: string }) {
  const { data, isLoading, isError } = useInviteInfo(inviteCode);

  if (isLoading) {
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

  return <GuestJoinForm inviteCode={inviteCode} info={data} />;
}
