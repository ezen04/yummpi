'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft } from '@yummpi/ui';
import { KakaoMap, type KakaoCustomPin } from '@/components/common/KakaoMap';
import { PlaceSearchInput } from './PlaceSearchInput';
import {
  searchStationLineRows,
  type StationLineRow,
} from '../../utils/stationSearch';

interface StationSearchSheetProps {
  open: boolean;
  onClose: () => void;
  onSelect: (station: StationLineRow) => void;
}

// 지도 위에 띄울 핀 개수 — 너무 많으면 지도가 산만해짐
const MAX_PINS = 5;
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };

/** MapPin과 동일 톤의 plain teardrop 핀 HTML (CustomOverlay 주입용) */
function plainPinHTML(): string {
  return `
    <div style="position: relative; width: 24px; height: 32px; display: inline-block;">
      <svg viewBox="0 0 64 80" width="24" height="32" style="display: block; filter: drop-shadow(var(--shadow-pin));">
        <path d="M32 2 C 15 2 2 15 2 31 C 2 46 18 63 29.4 73 C 30.9 74.3 33.1 74.3 34.6 73 C 46 63 62 46 62 31 C 62 15 49 2 32 2 Z" fill="var(--primary)" stroke="#fff" stroke-width="3" stroke-linejoin="round" />
        <circle cx="32" cy="30" r="10" fill="#fff" />
      </svg>
    </div>
  `;
}

/**
 * 출발역 입력 페이지에서 input을 누르면 뜨는 풀스크린 시트.
 * 입력 → 매칭되는 역들이 지도에 번호 핀으로 + 아래 리스트로 표시되고,
 * 핀 클릭 또는 리스트 선택 시 onSelect로 위임 후 닫힘은 부모가 결정.
 */
export function StationSearchSheet({
  open,
  onClose,
  onSelect,
}: StationSearchSheetProps) {
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchStationLineRows(query), [query]);

  // 시트 열림 동안 body 스크롤 잠금
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // 닫기/선택 시 입력 초기화 — 다음 열림이 깨끗하게
  const handleClose = () => {
    setQuery('');
    onClose();
  };
  const handleSelect = (row: StationLineRow) => {
    setQuery('');
    onSelect(row);
  };

  const center = useMemo(() => {
    if (results.length === 0) return DEFAULT_CENTER;
    return { lat: results[0].lat, lng: results[0].lng };
  }, [results]);

  const customPins: KakaoCustomPin[] = useMemo(() => {
    return results.slice(0, MAX_PINS).map((row) => ({
      id: `${row.rawName}-${row.lineCode}`,
      lat: row.lat,
      lng: row.lng,
      html: plainPinHTML(),
      onClick: () => {
        setQuery('');
        onSelect(row);
      },
    }));
  }, [results, onSelect]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] mx-auto max-w-[480px] bg-[var(--bg-normal)] flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center h-14 px-3 shrink-0">
        <button
          type="button"
          onClick={handleClose}
          className="p-2 -ml-2"
          aria-label="닫기"
        >
          <ChevronLeft size={24} strokeWidth={1.8} />
        </button>
        <h2 className="ml-1 text-[17px] font-semibold text-[var(--label-normal)]">
          장소 검색
        </h2>
      </div>

      {/* 검색 input */}
      <div className="px-5 pb-3 shrink-0">
        <PlaceSearchInput
          value={query}
          onChange={setQuery}
          placeholder="역 이름으로 검색 (예: 강남)"
          autoFocus
        />
      </div>

      {/* 지도 카드 — 검색어가 있을 때만 노출 */}
      {query.trim() !== '' && (
        <div className="px-5 pb-3 shrink-0">
          <div className="rounded-[var(--radius-12)] overflow-hidden border border-[var(--line-normal)]">
            <KakaoMap
              center={center}
              customPins={customPins}
              height="200px"
            />
          </div>
        </div>
      )}

      {/* 핸들 (시각용 구분선) */}
      <div className="shrink-0 py-2">
        <div className="mx-auto w-[36px] h-1 rounded-full bg-[var(--line-warm)]" />
      </div>

      {/* 결과 리스트 */}
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
                  className="flex w-full items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-[var(--primary-tint)]"
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
