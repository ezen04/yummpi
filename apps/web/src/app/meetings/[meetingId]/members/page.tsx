import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentMember } from '@/lib/current-member';
import {
  MembersView,
  type MemberRow,
} from '@/features/meeting/components/MembersView';

/**
 * 모임 참여자 전체보기 (Figma 709-1082·1124·1580).
 * 회원: 읽기 전용 / 호스트: 권한 위임·강제 탈퇴. 멤버 가드는 상위 layout.
 */
export default async function MembersPage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;

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

  const me = await getCurrentMember(meetingId);

  // 호스트 먼저 정렬.
  const members: MemberRow[] = meeting.members
    .map((m) => ({
      id: m.id,
      nickname: m.nickname,
      isHost: m.role === 'HOST',
      isGuest: m.userId === null,
    }))
    .sort((a, b) => Number(b.isHost) - Number(a.isHost));

  return (
    <div className="h-screen">
      <MembersView
        meetingId={meetingId}
        title={meeting.title}
        members={members}
        meId={me?.id ?? null}
        isHost={me?.role === 'HOST'}
      />
    </div>
  );
}
