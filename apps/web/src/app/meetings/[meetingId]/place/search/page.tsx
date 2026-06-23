import { notFound } from 'next/navigation';
import { assertHost, getCurrentMember } from '@/lib/current-member';
import { PlaceSearchPage } from '@/features/place/pages/PlaceSearchPage';

export default async function Page({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;

  const member = await getCurrentMember(meetingId);
  if (!member) notFound();

  // 호스트 전용 — 후보 추가(mode=add) · 검색 확정(mode=confirm) 모두 호스트만 가능
  await assertHost(meetingId);

  return <PlaceSearchPage meetingId={meetingId} />;
}
