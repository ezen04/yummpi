'use client';

import { useSocket, useSocketEvent } from '@/hooks/useSocket';
import { useVote } from '@/hooks/useVote';
import { toast } from '@yummpi/ui';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { RecruitingView } from '../components/recruiting/RecruitingView';
import { RecruitingViewSkeleton } from '../components/recruiting/RecruitingViewSkeleton';
import { NotInVoteFlowView } from '../components/shell/NotInVoteFlowView';
import { VoteErrorState } from '../components/shell/VoteErrorState';
import { VoteLoadingSkeleton } from '../components/shell/VoteLoadingSkeleton';
import { VoteScreenContainer } from '../components/shell/VoteScreenContainer';
import { VotingView } from '../components/voting/VotingView';
import { VotingViewSkeleton } from '../components/voting/VotingViewSkeleton';
import type { MeetingStatus } from '../hooks/useMeetingDetail';
import { useMeetingDetail } from '../hooks/useMeetingDetail';

export interface VotePageProps {
  meetingId: string;
  viewerRole: 'HOST' | 'MEMBER';
  viewerMemberId: string;
  /**
   * 서버에서 prefetch한 meeting.status. client 첫 mount 시점에
   * meeting 데이터 fetch 완료 전에도 status별 스켈레톤 분기 가능.
   */
  initialStatus?: MeetingStatus;
}

export function VotePage({
  meetingId,
  viewerRole,
  viewerMemberId,
  initialStatus,
}: VotePageProps) {
  const router = useRouter();

  const {
    data: meeting,
    isLoading: meetingLoading,
    isError: meetingError,
    refetch: refetchMeeting,
  } = useMeetingDetail(meetingId);

  const { votesData, isLoading: votesLoading } = useVote(meetingId);

  useSocket(meetingId);

  // A-4: 다른 멤버(주로 게스트) 화면에서 호스트의 장소 확정을 실시간 안내.
  // 호스트 본인은 ConfirmPlaceSheet에서 이미 toast+push를 처리하고 unmount 되므로
  // 이 핸들러가 호출되기 전에 화면을 벗어남 → 중복 toast 없음.
  useSocketEvent('place:confirmed', () => {
    toast.success('장소가 확정되었어요!');
    router.replace(`/meetings/${meetingId}`);
  });

  // N-1: 호스트가 투표 시작 → meeting:status-changed echo로 모든 클라이언트에게
  // 토스트 안내. 호스트 본인 탭도 echo 받지만 본인은 시작 액션을 인지하고 있으므로
  // 부드러운 success 안내가 자연스러움. (게스트는 화면이 자동 전환되므로 안내 필수)
  useSocketEvent('meeting:status-changed', (data) => {
    if (data.status === 'VOTING') {
      toast.success('투표가 시작되었어요!');
    }
  });

  const handleBack = () => router.back();

  // PLACE_CONFIRMED 상태로 진입(직접 URL 또는 socket으로 자동 전환)하면
  // 모임 상세 페이지로 redirect — vote 페이지는 RECRUITING/VOTING 단계 전용
  React.useEffect(() => {
    if (meeting?.status === 'PLACE_CONFIRMED') {
      router.replace(`/meetings/${meetingId}`);
    }
  }, [meeting?.status, meetingId, router]);

  // status별 스켈레톤 분기 — 서버 prefetch한 initialStatus 우선, 없으면 client meeting
  const effectiveStatus: MeetingStatus | undefined =
    meeting?.status ?? initialStatus;

  const renderStatusSkeleton = () => {
    if (effectiveStatus === 'RECRUITING') {
      return <RecruitingViewSkeleton onBack={handleBack} />;
    }
    if (effectiveStatus === 'VOTING') {
      return <VotingViewSkeleton onBack={handleBack} />;
    }
    return <VoteLoadingSkeleton />;
  };

  const renderContent = () => {
    // meeting 또는 votes 로딩 중 — initialStatus(서버 prefetch) 활용해
    // 첫 mount부터 바로 status별 스켈레톤 표시 (generic 단계 거치지 않음)
    if (meetingLoading || votesLoading) {
      return renderStatusSkeleton();
    }

    if (meetingError || !meeting || !votesData) {
      return (
        <VoteErrorState
          onRetry={() => void refetchMeeting()}
          onBack={handleBack}
        />
      );
    }

    const viewProps = {
      meeting,
      votesData,
      viewerRole,
      viewerMemberId,
      onBack: handleBack,
    };

    switch (meeting.status) {
      case 'RECRUITING':
        return <RecruitingView {...viewProps} />;
      case 'VOTING':
        return <VotingView {...viewProps} />;
      case 'PLACE_CONFIRMED':
        // useEffect로 redirect 진행 중 — 로딩 화면을 보여 깜빡임 방지
        return <VoteLoadingSkeleton />;
      default:
        return (
          <NotInVoteFlowView
            meetingId={meetingId}
            status={meeting.status}
            onBack={handleBack}
          />
        );
    }
  };

  return <VoteScreenContainer>{renderContent()}</VoteScreenContainer>;
}
