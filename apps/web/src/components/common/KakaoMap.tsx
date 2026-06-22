'use client';

export interface Marker {
  lat: number;
  lng: number;
  /** 마커 위에 표시할 텍스트 */
  label?: string;
  /** onMarkerClick 콜백에서 어떤 마커를 클릭했는지 구분하는 식별자 */
  id?: string;
}

export interface KakaoMapProps {
  /** 지도 중심 좌표 (필수) */
  center: { lat: number; lng: number };
  /** 지도에 표시할 마커 목록 */
  markers?: Marker[];
  /** 지도 높이 (기본값: '40vh') */
  height?: string;
  /** 마커 클릭 시 호출. 클릭된 마커의 id를 전달 */
  onMarkerClick?: (markerId: string) => void;
}

/**
 * 카카오 지도 공통 컴포넌트.
 * 현재는 placeholder — 6/22에 Kakao Maps SDK로 교체 예정.
 */
export function KakaoMap({ height = '40vh' }: KakaoMapProps) {
  return (
    <div
      style={{ height }}
      className="w-full rounded-xl bg-[var(--bg-alternative)] flex items-center justify-center"
    >
      <span className="text-[var(--label-alternative)] text-sm">
        지도 로딩 중...
      </span>
    </div>
  );
}
