'use client';

import { useRouter } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { StationSearchPicker } from '../components/search/StationSearchPicker';
import { type StationLineRow } from '../utils/stationSearch';
import { useSetDeparture } from '../hooks/useSetDeparture';

/**
 * 실제 라우트용 — 출발역 검색 → 선택 → 내 좌표(+역이름) 저장 → 결과로 이동.
 * 역 검색 UI는 StationSearchPicker(생성 폼과 공용), 저장은 ① members PATCH 계약 사용.
 */
export function DepartureInputView({
  meetingId,
  memberId,
}: {
  meetingId: string;
  memberId: string;
}) {
  const router = useRouter();
  const { mutate, isPending, error } = useSetDeparture(meetingId, memberId);

  const handleSelect = (row: StationLineRow) => {
    mutate(
      { lat: row.lat, lng: row.lng, stationName: row.stationName },
      {
        onSuccess: () => {
          router.push(`/meetings/${meetingId}/place/waiting`);
        },
      }
    );
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-normal)]">
      <Header title="출발역 입력" onBack={() => router.back()} />

      <StationSearchPicker
        onSelect={handleSelect}
        placeholder="출발역을 검색해주세요"
        disabled={isPending}
        error={
          error
            ? error instanceof Error
              ? error.message
              : '저장에 실패했어요.'
            : null
        }
        className="flex-1"
      />
    </div>
  );
}
