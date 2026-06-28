import { notFound, redirect } from 'next/navigation';
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

  // vote 페이지는 RECRUITING/VOTING 전용. 이후 상태에서 진입하면 모임 상세로
  // 서버 측 redirect — client effect 기반 redirect로는 스켈레톤이 짧게 노출됨.
  if (meeting.status !== 'RECRUITING' && meeting.status !== 'VOTING') {
    redirect(`/meetings/${meetingId}`);
  }

  return (
    <VotePage
      meetingId={meetingId}
      viewerRole={member.role}
      viewerMemberId={member.id}
      initialStatus={meeting.status}
    />
  );
}
