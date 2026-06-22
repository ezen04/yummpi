'use client';

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
import { PlaceConfirmedView } from '../components/completed/PlaceConfirmedView';

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
        return <PlaceConfirmedView {...viewProps} />;
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
