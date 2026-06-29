import { prisma } from '@/lib/prisma';
import { MeetingCompletePage } from '@/features/payment/pages/MeetingCompletePage';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** 모임 일시 → "6월 29일 (일) 오후 7:30" 표기 (null이면 undefined) */
function formatScheduledAt(date: Date | null): string | undefined {
  if (!date) return undefined;
  const h = date.getHours();
  const ampm = h < 12 ? '오전' : '오후';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAYS[date.getDay()]}) ${ampm} ${h12}:${mm}`;
}

export default async function Page({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;

  // ④ 완료 화면 장소/일시: GET /payments 응답엔 장소가 없어 여기서 직접 조회한다.
  // 모임 스키마(①)는 읽기 전용 — confirmedCandidate.name이 확정 장소명.
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: {
      title: true,
      scheduledAt: true,
      confirmedCandidate: { select: { name: true } },
    },
  });

  return (
    <MeetingCompletePage
      meetingId={meetingId}
      meetingName={meeting?.title ?? undefined}
      placeName={meeting?.confirmedCandidate?.name ?? undefined}
      placeDateTime={formatScheduledAt(meeting?.scheduledAt ?? null)}
    />
  );
}
