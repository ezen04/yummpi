'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { useVote } from '@/hooks/useVote';
import { useMeetingDetail } from '../hooks/useMeetingDetail';
import { VoteLoadingSkeleton } from '../components/shell/VoteLoadingSkeleton';
import { VoteErrorState } from '../components/shell/VoteErrorState';
import { NotInVoteFlowView } from '../components/shell/NotInVoteFlowView';
import { VoteScreenContainer } from '../components/shell/VoteScreenContainer';
import { RecruitingView } from '../components/recruiting/RecruitingView';
import { VotingView } from '../components/voting/VotingView';

export interface VotePageProps {
  meetingId: string;
  viewerRole: 'HOST' | 'MEMBER';
  viewerMemberId: string;
}

export function VotePage({
  meetingId,
  viewerRole,
  viewerMemberId,
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

  const handleBack = () => router.back();

  // PLACE_CONFIRMED 상태로 진입(직접 URL 또는 socket으로 자동 전환)하면
  // 모임 상세 페이지로 redirect — vote 페이지는 RECRUITING/VOTING 단계 전용
  React.useEffect(() => {
    if (meeting?.status === 'PLACE_CONFIRMED') {
      router.replace(`/meetings/${meetingId}`);
    }
  }, [meeting?.status, meetingId, router]);

  const renderContent = () => {
    if (meetingLoading || votesLoading) {
      return <VoteLoadingSkeleton />;
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
