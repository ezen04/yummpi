'use client';

import { create } from 'zustand';
import type { RecommendationItem } from '@/features/place/api/placeApi';

interface VoteUiState {
  votingClosesAtSheetOpen: boolean;
  confirmPlaceSheetOpen: boolean;
  selectedCandidateId: string | null;
  /** 검색 결과로 확정할 때 임시 보관. 후보 ID 분기와 상호 배타. */
  selectedSearchPlace: RecommendationItem | null;

  openVotingClosesAt: () => void;
  closeVotingClosesAt: () => void;

  openConfirmPlace: (candidateId: string) => void;
  openConfirmPlaceFromSearch: (place: RecommendationItem) => void;
  closeConfirmPlace: () => void;

  reset: () => void;
}

export const useVoteUiStore = create<VoteUiState>((set) => ({
  votingClosesAtSheetOpen: false,
  confirmPlaceSheetOpen: false,
  selectedCandidateId: null,
  selectedSearchPlace: null,

  openVotingClosesAt: () => set({ votingClosesAtSheetOpen: true }),
  closeVotingClosesAt: () => set({ votingClosesAtSheetOpen: false }),

  openConfirmPlace: (candidateId) =>
    set({
      confirmPlaceSheetOpen: true,
      selectedCandidateId: candidateId,
      selectedSearchPlace: null,
    }),
  openConfirmPlaceFromSearch: (place) =>
    set({
      confirmPlaceSheetOpen: true,
      selectedCandidateId: null,
      selectedSearchPlace: place,
    }),
  closeConfirmPlace: () =>
    set({
      confirmPlaceSheetOpen: false,
      selectedCandidateId: null,
      selectedSearchPlace: null,
    }),

  reset: () =>
    set({
      votingClosesAtSheetOpen: false,
      confirmPlaceSheetOpen: false,
      selectedCandidateId: null,
      selectedSearchPlace: null,
    }),
}));
