import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import SettlementNewContent from './_content';

export default async function SettlementNewPage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;

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
