import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { PaymentStatusPage } from '@/features/payment/pages/PaymentStatusPage';

export default async function PaymentsPage({
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

  return <PaymentStatusPage meetingId={meetingId} />;
}
