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
  if (!member) return null;

  if (member.role !== 'HOST') {
    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
      select: { status: true },
    });
    if (settlement?.status !== 'DRAFT') {
      redirect(`/meetings/${meetingId}`);
    }
    const assignmentCount = await prisma.itemAssignment.count({
      where: { settlementId, memberId: member.id },
    });
    if (assignmentCount > 0) {
      redirect(`/meetings/${meetingId}`);
    }
  }

  const items = await prisma.receiptItem.findMany({
    where: { receipt: { meetingId } },
    select: { id: true, name: true, totalPrice: true },
    orderBy: [{ receipt: { createdAt: 'asc' } }, { sortOrder: 'asc' }],
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
