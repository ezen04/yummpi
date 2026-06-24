'use client';

import { Header } from '@/components/common/Header';
import { Tipbox } from '@/components/common/Tipbox';
import type { VotesData } from '@/hooks/useVote';
import type { MeetingDetail } from '../../hooks/useMeetingDetail';

export interface PlaceConfirmedViewProps {
  meeting: MeetingDetail;
  votesData: VotesData;
  viewerRole: 'HOST' | 'MEMBER';
  viewerMemberId: string;
  onBack?: () => void;
}

/**
 * PLACE_CONFIRMED 상태 진입 시 실제 페이지(`VotePage`)는 `/meetings/[id]`로 자동
 * redirect. 이 컴포넌트는 dev preview 안내용으로만 유지된다.
 *
 * 운영 환경에서 사용자가 직접 URL 진입하더라도 useEffect redirect가 발화하므로
 * 잠깐만 보였다 사라진다.
 */
export function PlaceConfirmedView({
  meeting: _meeting,
  votesData: _votesData,
  viewerRole: _viewerRole,
  viewerMemberId: _viewerMemberId,
  onBack,
}: PlaceConfirmedViewProps) {
  return (
    <div className="flex flex-col h-full bg-[var(--bg-normal)]">
      <Header title="장소 확정 완료" onBack={onBack} />
      <div className="flex-1 flex flex-col items-center justify-center px-5 text-center gap-3">
        <Tipbox variant="completed-vote">
          장소가 확정되었어요! 모임 상세 페이지로 이동합니다.
        </Tipbox>
        <p className="text-[12px] font-normal font-[var(--font-sans)] text-[var(--label-assistive)] m-0">
          (dev preview에서만 보이는 안내 — 실제 진입 시 자동 redirect)
        </p>
      </div>
    </div>
  );
}
