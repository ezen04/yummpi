import { notFound } from 'next/navigation';
import { getCurrentMember } from '@/lib/current-member';
import { PlaceSearchPage } from '@/features/place/pages/PlaceSearchPage';

export default async function Page({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;
  const member = await getCurrentMember(meetingId);
  if (!member) notFound();

  return <PlaceSearchPage meetingId={meetingId} viewerRole={member.role} />;
}
