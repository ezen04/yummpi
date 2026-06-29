'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { PlaceSearchInput } from './PlaceSearchInput';
import {
  searchStationLineRows,
  type StationLineRow,
} from '../../utils/stationSearch';

interface StationSearchPickerProps {
  /** 역 선택 시 호출 — 저장/이동 등 후속 동작은 호출하는 쪽이 정한다(부수효과 미포함). */
  onSelect: (station: StationLineRow) => void;
  placeholder?: string;
  /** 저장 중 등 선택을 잠글 때 */
  disabled?: boolean;
  /** 입력창 아래 표시할 오류 메시지(예: 저장 실패) */
  error?: string | null;
  className?: string;
}

/**
 * 출발역/만남역 공용 역 검색 부품 — 입력창 + 로컬 지하철 데이터 검색 + 결과 목록(노선 뱃지)만 담당.
 * 저장·네비게이션·헤더는 포함하지 않으며, 선택 결과는 onSelect로만 위임한다.
 * - DepartureInputView(②): onSelect → 멤버 좌표 저장 + 대기 화면 이동
 * - 모임 생성 폼(①): onSelect → 폼 state에 {stationName, lat, lng} 보관
 * 레이아웃은 flex 컬럼 + 높이 제한된 컨테이너 안에서 결과 영역이 스크롤되도록 가정한다.
 */
export function StationSearchPicker({
  onSelect,
  placeholder = '역을 검색해주세요',
  disabled = false,
  error,
  className,
}: StationSearchPickerProps) {
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchStationLineRows(query), [query]);

  const handleSelect = (row: StationLineRow) => {
    if (disabled) return;
    onSelect(row);
  };

  return (
    <div className={cn('flex flex-col min-h-0', className)}>
      <div className="shrink-0 px-5 pt-4 pb-3">
        <PlaceSearchInput
          value={query}
          onChange={setQuery}
          placeholder={placeholder}
        />
        {error && (
          <p className="mt-2 text-[13px] text-[var(--status-negative)]">
            {error}
          </p>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {query.trim() === '' ? (
          <p className="px-5 pt-6 text-center text-[14px] text-[var(--label-assistive)]">
            역 이름을 입력하면 검색돼요 (예: 강남)
          </p>
        ) : results.length === 0 ? (
          <p className="px-5 pt-6 text-center text-[14px] text-[var(--label-assistive)]">
            검색 결과가 없어요.
          </p>
        ) : (
          <ul>
            {results.map((row) => (
              <li key={`${row.rawName}-${row.lineCode}`}>
                <button
                  type="button"
                  onClick={() => handleSelect(row)}
                  disabled={disabled}
                  className="flex w-full items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-[var(--primary-tint)] disabled:opacity-50"
                >
                  <span className="text-[15px] text-[var(--label-normal)]">
                    {row.stationName}
                  </span>
                  {/^\d+$/.test(row.lineLabel) ? (
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white"
                      style={{ backgroundColor: row.lineColor }}
                    >
                      {row.lineLabel}
                    </span>
                  ) : (
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
                      style={{ backgroundColor: row.lineColor }}
                    >
                      {row.lineLabel}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
