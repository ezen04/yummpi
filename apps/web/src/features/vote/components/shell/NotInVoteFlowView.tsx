'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/common/Button';
import { Header } from '@/components/common/Header';
import { Tipbox } from '@/components/common/Tipbox';
import type { MeetingStatus } from '../../hooks/useMeetingDetail';

interface NotInVoteFlowViewProps {
  meetingId: string;
  status: MeetingStatus;
  onBack?: () => void;
}

interface FlowConfig {
  message: string;
  ctaLabel: string;
  ctaHref: string;
}

function resolveFlowConfig(
  meetingId: string,
  status: MeetingStatus
): FlowConfig {
  switch (status) {
    case 'DRAFT':
      return {
        message: '모임이 아직 시작되지 않았어요.',
        ctaLabel: '모임 상세로 이동',
        ctaHref: `/meetings/${meetingId}`,
      };
    case 'IN_PROGRESS':
      return {
        message: '예약 진행 중이에요.',
        ctaLabel: '모임 상세로 이동',
        ctaHref: `/meetings/${meetingId}`,
      };
    case 'SETTLING':
      return {
        message: '정산이 진행 중이에요.',
        ctaLabel: '정산 페이지로 이동',
        ctaHref: `/meetings/${meetingId}/settlement`,
      };
    case 'COMPLETED':
      return {
        message: '모임이 종료되었어요.',
        ctaLabel: '결과 보기',
        ctaHref: `/meetings/${meetingId}/payments`,
      };
    default:
      return {
        message: '현재 단계에서는 투표 화면을 볼 수 없어요.',
        ctaLabel: '모임 상세로 이동',
        ctaHref: `/meetings/${meetingId}`,
      };
  }
}

export function NotInVoteFlowView({
  meetingId,
  status,
  onBack,
}: NotInVoteFlowViewProps) {
  const router = useRouter();
  const config = resolveFlowConfig(meetingId, status);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[var(--bg-normal)]">
      <Header title="장소 투표" onBack={onBack} />

      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-5 text-center">
        <Tipbox variant="normal">{config.message}</Tipbox>
        <Button
          variant="basic"
          size="lg"
          onClick={() => router.push(config.ctaHref)}
          className="w-full max-w-[280px]"
        >
          {config.ctaLabel}
        </Button>
      </div>
    </div>
  );
}
