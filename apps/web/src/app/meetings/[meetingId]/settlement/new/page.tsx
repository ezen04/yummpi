import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentMember } from '@/lib/current-member';
import SettlementNewContent from './_content';

export default async function SettlementNewPage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;

  const member = await getCurrentMember(meetingId);
  if (!member || member.role !== 'HOST') {
    redirect(`/meetings/${meetingId}`);
  }

  const settlement = await prisma.settlement.findUnique({
    where: { meetingId },
    select: { status: true },
  });
  if (
    settlement?.status === 'CONFIRMED' ||
    settlement?.status === 'COMPLETED'
  ) {
    redirect(`/meetings/${meetingId}/payments`);
  }

  return <SettlementNewContent params={params} />;
}
