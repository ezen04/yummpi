import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentMember } from '@/lib/current-member';
import { CreateMeetingForm } from '@/features/meeting/components/CreateMeetingForm';

/**
 * 모임 수정 — 생성 폼(`CreateMeetingForm`)을 edit 모드로 재사용.
 * 호스트만 진입, 종료(COMPLETED)·취소(CANCELLED) 모임은 수정 불가 → 허브로 복귀.
 * 상위 layout이 모임 존재·멤버 가드를 수행하므로 여기선 호스트·상태 가드 + prefill만.
 */
export default async function EditMeetingPage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;

  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
  });
  if (!meeting) notFound();

  const member = await getCurrentMember(meetingId);
  if (member?.role !== 'HOST') {
    redirect(`/meetings/${meetingId}`);
  }
  if (meeting.status === 'COMPLETED' || meeting.status === 'CANCELLED') {
    redirect(`/meetings/${meetingId}`);
  }

  return (
    <CreateMeetingForm
      mode="edit"
      meetingId={meetingId}
      initial={{
        title: meeting.title,
        description: meeting.description ?? '',
        scheduledAt: meeting.scheduledAt?.toISOString() ?? null,
        maxMembers:
          meeting.maxMembers != null ? String(meeting.maxMembers) : '',
      }}
    />
  );
}
