import { redirect, notFound } from 'next/navigation';
import { getCurrentMember } from '@/lib/current-member';
import { prisma } from '@/lib/prisma';

export default async function MeetingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;

  const member = await getCurrentMember(meetingId); // 회원+게스트 둘 다 해석
  if (!member) redirect(`/api/auth/signin?callbackUrl=/meetings/${meetingId}`);

  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: { cancelledAt: true },
  });
  if (!meeting || meeting.cancelledAt) notFound();

  return <>{children}</>;
}
