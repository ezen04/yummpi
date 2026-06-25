import { notFound } from 'next/navigation';
import { getCurrentMember } from '@/lib/current-member';
import { prisma } from '@/lib/prisma';
import { VotePage } from '@/features/vote/pages/VotePage';

export default async function Page({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;
  const member = await getCurrentMember(meetingId);
  if (!member) notFound();

  // 서버에서 meeting.status를 미리 받아 client에 전달 →
  // VotePage가 첫 mount 시점에 generic skeleton 단계 없이 바로 status별
  // 스켈레톤(RecruitingViewSkeleton/VotingViewSkeleton)을 표시.
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: { status: true },
  });
  if (!meeting) notFound();

  return (
    <VotePage
      meetingId={meetingId}
      viewerRole={member.role}
      viewerMemberId={member.id}
      initialStatus={meeting.status}
    />
  );
}
