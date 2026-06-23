'use client';

import { create } from 'zustand';

interface VoteUiState {
  votingClosesAtSheetOpen: boolean;
  confirmPlaceSheetOpen: boolean;
  selectedCandidateId: string | null;

  openVotingClosesAt: () => void;
  closeVotingClosesAt: () => void;

  openConfirmPlace: (candidateId: string) => void;
  closeConfirmPlace: () => void;

  reset: () => void;
}

export const useVoteUiStore = create<VoteUiState>((set) => ({
  votingClosesAtSheetOpen: false,
  confirmPlaceSheetOpen: false,
  selectedCandidateId: null,

  openVotingClosesAt: () => set({ votingClosesAtSheetOpen: true }),
  closeVotingClosesAt: () => set({ votingClosesAtSheetOpen: false }),

  openConfirmPlace: (candidateId) =>
    set({ confirmPlaceSheetOpen: true, selectedCandidateId: candidateId }),
  closeConfirmPlace: () =>
    set({ confirmPlaceSheetOpen: false, selectedCandidateId: null }),

  reset: () =>
    set({
      votingClosesAtSheetOpen: false,
      confirmPlaceSheetOpen: false,
      selectedCandidateId: null,
    }),
}));
