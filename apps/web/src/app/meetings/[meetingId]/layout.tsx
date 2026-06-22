import { notFound } from 'next/navigation';
import { getCurrentMember } from '@/lib/current-member';
import { prisma } from '@/lib/prisma';
import { PaymentJoinRequired } from '@/features/payment/components/shell/PaymentJoinRequired';

export default async function MeetingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;

  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: { cancelledAt: true },
  });
  if (!meeting || meeting.cancelledAt) notFound();

  const member = await getCurrentMember(meetingId); // 회원+게스트 둘 다 해석
  if (!member) return <PaymentJoinRequired meetingId={meetingId} />;

  return <>{children}</>;
}
