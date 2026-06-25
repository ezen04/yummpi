import { notFound } from 'next/navigation';
import { getCurrentMember } from '@/lib/current-member';
import { WaitingView } from '@/features/place/pages/WaitingView';

// 출발역 입력 대기 화면 — 실제 라우트
export default async function Page({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;

  const member = await getCurrentMember(meetingId);
  if (!member) notFound();

  return <WaitingView meetingId={meetingId} />;
}
