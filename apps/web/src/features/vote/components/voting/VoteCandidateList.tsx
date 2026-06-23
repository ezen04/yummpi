'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { VoteCandidate } from '@/hooks/useVote';
import { VoteCandidateCard } from './VoteCandidateCard';

interface VoteCandidateListProps {
  candidates: VoteCandidate[];
  myCandidateId: string | null;
  topCandidateId: string | null;
  onVote: (candidateId: string) => void;
  disabled?: boolean;
  className?: string;
}

export function VoteCandidateList({
  candidates,
  myCandidateId,
  topCandidateId,
  onVote,
  disabled = false,
  className,
}: VoteCandidateListProps) {
  if (candidates.length === 0) {
    return (
      <p
        className={cn(
          'text-[13px] leading-[18px] font-normal font-[var(--font-sans)]',
          'text-[var(--label-alternative)] text-center py-8 m-0',
          className
        )}
      >
        후보가 없어요
      </p>
    );
  }

  return (
    <div className={cn('flex flex-col gap-[10px]', className)}>
      {candidates.map((candidate) => (
        <VoteCandidateCard
          key={candidate.id}
          candidate={candidate}
          isMyVote={candidate.id === myCandidateId}
          isTopVote={candidate.id === topCandidateId}
          onClick={() => onVote(candidate.id)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
