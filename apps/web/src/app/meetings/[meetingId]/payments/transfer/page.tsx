import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { TransferStatusPage } from '@/features/payment/pages/TransferStatusPage';

export default async function Page({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;

  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: { status: true },
  });
  if (meeting?.status === 'COMPLETED') {
    redirect(`/meetings/${meetingId}/payments/complete`);
  }

  return <TransferStatusPage meetingId={meetingId} />;
}
