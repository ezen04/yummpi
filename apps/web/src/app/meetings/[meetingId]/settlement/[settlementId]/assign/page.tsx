import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentMember } from '@/lib/current-member';
import AssignContent from './_content';

export default async function SettlementAssignPage({
  params,
}: {
  params: Promise<{ meetingId: string; settlementId: string }>;
}) {
  const { meetingId, settlementId } = await params;

  const member = await getCurrentMember(meetingId);
  if (!member) {
    redirect(`/meetings/${meetingId}`);
  }

  const items = await prisma.receiptItem.findMany({
    where: { receipt: { meetingId } },
    select: { id: true, name: true, totalPrice: true },
    orderBy: [
      { receipt: { createdAt: 'asc' } },
      { sortOrder: 'asc' },
    ],
  });

  return (
    <AssignContent
      meetingId={meetingId}
      settlementId={settlementId}
      items={items}
      initialRole={member.role}
      initialNickname={member.nickname}
    />
  );
}
