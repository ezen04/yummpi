import { notFound } from 'next/navigation';
import { assertHost, getCurrentMember } from '@/lib/current-member';
import { WaitSetupView } from '@/features/place/pages/WaitSetupView';

// 출발역 입력 대기시간 설정 — 호스트 전용 실제 라우트
export default async function Page({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;

  const member = await getCurrentMember(meetingId);
  if (!member) notFound();
  await assertHost(meetingId); // 호스트 전용

  return <WaitSetupView meetingId={meetingId} />;
}
