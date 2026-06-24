import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { MeetingStatus } from '@prisma/client';
import { Button } from '@yummpi/ui';
import { prisma } from '@/lib/prisma';
import { getCurrentMember } from '@/lib/current-member';
import { StartRecruitingButton } from '@/features/meeting/components/StartRecruitingButton';
import { StartMeetingButton } from '@/features/meeting/components/StartMeetingButton';
import { ReservationPanel } from '@/features/reservation/components/ReservationPanel';

/**
 * 입장 후 상태별 라우팅 허브 (결정#4, 2026-06-21).
 *
 * 상위 layout(⑤)이 모임 존재·취소·멤버 가드를 이미 수행하므로 여기선 status 분기만 한다.
 * 라우트가 존재하는 단계만 실링크, 나머지는 "준비 중" placeholder.
 * ③ 투표/장소·④ 정산 화면이 생기면 해당 status의 cta를 그 라우트로 교체한다.
 */

type StageConfig = {
  label: string;
  desc: string;
  cta?: { href: string; label: string };
};

function stageConfig(meetingId: string): Record<MeetingStatus, StageConfig> {
  return {
    DRAFT: {
      label: '모임 준비 중',
      desc: '주최자가 모집을 시작하면 참여할 수 있어요.',
    },
    RECRUITING: {
      label: '장소 후보 모으는 중',
      desc: '가고 싶은 장소를 추천하고 후보를 모아요.',
    },
    VOTING: {
      label: '장소 투표 중',
      desc: '후보 중 가고 싶은 곳에 투표해요.',
    },
    PLACE_CONFIRMED: {
      label: '장소 확정',
      desc: '모임 장소가 정해졌어요.',
    },
    IN_PROGRESS: {
      label: '모임 진행 중',
      desc: '즐거운 모임 되세요!',
    },
    SETTLING: {
      label: '정산 중',
      desc: '영수증을 확인하고 소비한 항목을 선택해요.',
    },
    COMPLETED: {
      label: '종료된 모임',
      desc: '모임이 끝났어요. 송금 현황을 확인할 수 있어요.',
      cta: { href: `/meetings/${meetingId}/payments`, label: '송금 현황 보기' },
    },
    CANCELLED: {
      label: '취소된 모임',
      desc: '취소된 모임이에요.',
    },
  };
}

export default async function MeetingHubPage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;

  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: {
      title: true,
      status: true,
      confirmedCandidate: {
        select: { placeUrl: true, externalPlaceId: true, name: true },
      },
    },
  });
  if (!meeting) notFound();

  // 상위 layout이 멤버 가드를 통과시키므로 member는 보통 존재. 호스트 전용 액션 판별용.
  const member = await getCurrentMember(meetingId);
  const isHost = member?.role === 'HOST';
  const isDraftHost = meeting.status === 'DRAFT' && isHost;

  // 확정 장소 카카오맵 딥링크: place_url 우선, 없으면 externalPlaceId로 구성. 둘 다 없으면 숨김.
  const cc = meeting.confirmedCandidate;
  const placeUrl =
    cc?.placeUrl ??
    (cc?.externalPlaceId
      ? `https://place.map.kakao.com/${cc.externalPlaceId}`
      : null);

  // 장소 확정 이후(PLACE_CONFIRMED·IN_PROGRESS) 예약 패널 노출.
  const showReservation =
    meeting.status === 'PLACE_CONFIRMED' || meeting.status === 'IN_PROGRESS';

  const stage = stageConfig(meetingId)[meeting.status];
  const desc = isDraftHost
    ? '모집을 시작하면 초대 링크로 친구들이 참여할 수 있어요.'
    : stage.desc;

  return (
    <main
      className="min-h-screen flex flex-col justify-between px-6 py-12"
      style={{ background: 'var(--bg-alternative)' }}
    >
      <div className="flex flex-1 flex-col justify-center gap-6">
        <div className="space-y-3 text-center">
          <span
            className="inline-block rounded-full px-3 py-1 text-sm font-medium"
            style={{
              background: 'var(--primary-tint)',
              color: 'var(--primary)',
            }}
          >
            {stage.label}
          </span>
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--label-normal)' }}
          >
            {meeting.title}
          </h1>
          <p style={{ color: 'var(--label-alternative)' }}>{desc}</p>
        </div>

        {showReservation && (
          <ReservationPanel
            meetingId={meetingId}
            isHost={isHost}
            placeUrl={placeUrl}
            placeName={cc?.name ?? null}
          />
        )}
      </div>

      <div className="w-full">
        {isDraftHost ? (
          <StartRecruitingButton meetingId={meetingId} />
        ) : meeting.status === 'PLACE_CONFIRMED' && isHost ? (
          <StartMeetingButton meetingId={meetingId} />
        ) : stage.cta ? (
          <Link href={stage.cta.href} className="block w-full">
            <Button className="w-full">{stage.cta.label}</Button>
          </Link>
        ) : (
          <Button className="w-full" disabled>
            이 단계 화면은 준비 중이에요
          </Button>
        )}
      </div>
    </main>
  );
}
