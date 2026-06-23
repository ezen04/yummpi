import { notFound } from 'next/navigation';
import { getCurrentMember } from '@/lib/current-member';
import { VotePage } from '@/features/vote/pages/VotePage';

export default async function Page({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;
  const member = await getCurrentMember(meetingId);
  if (!member) notFound();

  return (
    <VotePage
      meetingId={meetingId}
      viewerRole={member.role}
      viewerMemberId={member.id}
    />
  );
}
