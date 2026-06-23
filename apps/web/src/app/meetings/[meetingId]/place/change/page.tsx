import { notFound } from 'next/navigation';
import { assertHost, getCurrentMember } from '@/lib/current-member';
import { PlaceChangePage } from '@/features/place/pages/PlaceChangePage';

export default async function Page({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;

  const member = await getCurrentMember(meetingId);
  if (!member) notFound();

  // 호스트 전용 — 비호스트는 즉시 403 (FORBIDDEN)
  await assertHost(meetingId);

  return <PlaceChangePage meetingId={meetingId} />;
}
