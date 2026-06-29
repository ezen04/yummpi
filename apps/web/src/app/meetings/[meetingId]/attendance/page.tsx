import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentMember } from '@/lib/current-member';
import {
  AttendanceView,
  type AttendMember,
} from '@/features/meeting/components/AttendanceView';

/**
 * 출석 체크 (Figma 709-1997, 주최자 전용).
 * 호스트가 참석/불참 확정 → 정산 생성(/settlement/new)으로. 비호스트는 허브로.
 */
export default async function AttendancePage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;

  const me = await getCurrentMember(meetingId);
  if (me?.role !== 'HOST') redirect(`/meetings/${meetingId}`);

  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: {
      title: true,
      members: {
        where: { leftAt: null },
        select: { id: true, nickname: true, role: true, userId: true },
      },
    },
  });
  if (!meeting) notFound();

  const members: AttendMember[] = meeting.members
    .map((m) => ({
      id: m.id,
      nickname: m.nickname,
      isHost: m.role === 'HOST',
      isGuest: m.userId === null,
    }))
    .sort((a, b) => Number(b.isHost) - Number(a.isHost));

  return (
    <div className="h-screen">
      <AttendanceView
        meetingId={meetingId}
        title={meeting.title}
        members={members}
      />
    </div>
  );
}
