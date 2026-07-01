import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentMember } from '@/lib/current-member';
import {
  MeetingHubView,
  type HubMember,
} from '@/features/meeting/components/MeetingHubView';

/**
 * 입장 후 모임 허브 (결정#4). Figma "모임상세페이지" 정합.
 *
 * 상위 layout이 모임 존재·취소·멤버 가드를 수행하므로 여기선 데이터 조립 + 뷰 렌더만.
 * 헤더 + 모임 정보 카드 + status별 "다음 할 일" + 모임 메뉴 그리드.
 */
export default async function MeetingHubPage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;

  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: {
      members: { where: { leftAt: null } },
      confirmedCandidate: true,
      settlement: { select: { id: true, status: true } },
    },
  });
  if (!meeting) notFound();

  const member = await getCurrentMember(meetingId);
  const isHost = member?.role === 'HOST';

  // 정산 확정(CONFIRMED) 이후 허브 CTA를 "송금 시작" vs "송금 현황"으로 가르기 위해
  // Payment 초기화 여부를 본다. 확정 단계에서만 조회(그 외 status는 불필요).
  const settlementStatus = meeting.settlement?.status ?? null;
  const settlementId = meeting.settlement?.id ?? null;
  let paymentsInitialized = false;
  if (settlementStatus === 'CONFIRMED' || settlementStatus === 'COMPLETED') {
    const paymentCount = await prisma.payment.count({
      where: { settlementMember: { settlement: { meetingId } } },
    });
    paymentsInitialized = paymentCount > 0;
  }

  // 비호스트 SETTLING + DRAFT: 내 ItemAssignment 존재 여부 → 탭 비활성·상태 카드 분기용
  let myAssignmentSubmitted = false;
  if (
    meeting.status === 'SETTLING' &&
    settlementId &&
    settlementStatus === 'DRAFT' &&
    member
  ) {
    const assignmentCount = await prisma.itemAssignment.count({
      where: { settlementId, memberId: member.id },
    });
    myAssignmentSubmitted = assignmentCount > 0;
  }

  // 호스트 먼저 정렬한 참여자 목록(아바타용).
  const members: HubMember[] = meeting.members
    .map((m) => ({ nickname: m.nickname, isHost: m.role === 'HOST' }))
    .sort((a, b) => Number(b.isHost) - Number(a.isHost));

  // 확정 장소: place_url 우선, 없으면 externalPlaceId로 카카오맵 딥링크 구성.
  const cc = meeting.confirmedCandidate;
  const confirmedPlace = cc
    ? {
        name: cc.name,
        address: cc.roadAddress ?? cc.address ?? null,
        phone: cc.phone ?? null,
        placeUrl:
          cc.placeUrl ??
          (cc.externalPlaceId
            ? `https://place.map.kakao.com/${cc.externalPlaceId}`
            : null),
      }
    : null;

  return (
    <div className="h-screen">
      <MeetingHubView
        meetingId={meetingId}
        title={meeting.title}
        status={meeting.status}
        scheduledAt={meeting.scheduledAt?.toISOString() ?? null}
        memberCount={members.length}
        members={members}
        confirmedPlace={confirmedPlace}
        isHost={isHost}
        settlementStatus={settlementStatus}
        settlementId={settlementId}
        paymentsInitialized={paymentsInitialized}
        myAssignmentSubmitted={myAssignmentSubmitted}
      />
    </div>
  );
}
