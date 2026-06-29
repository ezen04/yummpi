import { notFound, redirect } from 'next/navigation';
import { getCurrentMember } from '@/lib/current-member';
import { PlaceChangePage } from '@/features/place/pages/PlaceChangePage';

export default async function Page({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;

  const member = await getCurrentMember(meetingId);
  if (!member) notFound();

  // 호스트 전용 — 비호스트가 모임 상세에서 잘못된 링크로 진입한 경우
  // 에러 페이지 대신 모임 상세로 부드럽게 redirect.
  if (member.role !== 'HOST') {
    redirect(`/meetings/${meetingId}`);
  }

  return <PlaceChangePage meetingId={meetingId} />;
}
