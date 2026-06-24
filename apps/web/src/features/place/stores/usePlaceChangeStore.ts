'use client';

import { create } from 'zustand';
import type { RecommendationItem } from '../api/placeApi';

interface PlaceChangeState {
  /**
   * `/place/search?mode=confirm`에서 호스트가 검색 결과를 선택했을 때 저장되는 임시 장소.
   * `/place/change` 화면이 이 값을 읽어 검색창 아래에 카드로 표시한다.
   * 다른 검색 결과를 선택하면 덮어쓴다. 확정 완료 또는 페이지 이탈 시 clear.
   */
  pendingSearchPlace: RecommendationItem | null;
  setPendingSearchPlace: (place: RecommendationItem | null) => void;
  clearPendingSearchPlace: () => void;
}

export const usePlaceChangeStore = create<PlaceChangeState>((set) => ({
  pendingSearchPlace: null,
  setPendingSearchPlace: (place) => set({ pendingSearchPlace: place }),
  clearPendingSearchPlace: () => set({ pendingSearchPlace: null }),
}));
