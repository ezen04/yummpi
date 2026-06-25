import { notFound } from 'next/navigation';
import { getCurrentMember } from '@/lib/current-member';
import { DepartureInputView } from '@/features/place/pages/DepartureInputView';

// 출발역 입력 → 저장 → 최적역 결과 — 실제 라우트
export default async function Page({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;

  const member = await getCurrentMember(meetingId);
  if (!member) notFound();

  return <DepartureInputView meetingId={meetingId} memberId={member.id} />;
}
