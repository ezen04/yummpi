import { notFound } from 'next/navigation';
import { getCurrentMember } from '@/lib/current-member';
import { OptimalResultPage } from '@/features/place/pages/OptimalResultPage';

// 출발역 기반 최적 역(STATION) 결과 — 실제 라우트
export default async function Page({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;

  const member = await getCurrentMember(meetingId);
  if (!member) notFound();

  return <OptimalResultPage meetingId={meetingId} />;
}
