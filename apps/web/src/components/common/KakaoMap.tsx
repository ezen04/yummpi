'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';

// 카카오 Maps SDK 최소 타입 선언 (전역 window.kakao)
declare global {
  interface Window {
    kakao: {
      maps: {
        load: (callback: () => void) => void;
        Map: new (
          container: HTMLElement,
          options: { center: KakaoLatLng; level: number }
        ) => KakaoMapInstance;
        LatLng: new (lat: number, lng: number) => KakaoLatLng;
        Marker: new (options: {
          position: KakaoLatLng;
          map?: KakaoMapInstance;
        }) => KakaoMarker;
        event: {
          addListener: (
            target: KakaoMarker,
            type: string,
            handler: () => void
          ) => void;
        };
      };
    };
  }
}

interface KakaoLatLng {
  getLat: () => number;
  getLng: () => number;
}

interface KakaoMapInstance {
  setCenter: (latlng: KakaoLatLng) => void;
}

interface KakaoMarker {
  setMap: (map: KakaoMapInstance | null) => void;
}

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

export function KakaoMap({
  center,
  markers = [],
  height = '40vh',
  onMarkerClick,
}: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMapInstance | null>(null);
  const markerRefs = useRef<KakaoMarker[]>([]);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollAttemptsRef = useRef(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading'
  );

  // 최대 5초(50회 × 100ms) polling 후 실패 처리 — 무한 재시도 방지
  const MAX_POLL_ATTEMPTS = 50;

  const initMap = () => {
    if (!containerRef.current) return;
    // autoload=false + Next.js 16 Turbopack의 Script onLoad 타이밍 이슈 방어:
    // window.kakao가 아직 set되지 않은 경우 다음 tick에 재시도
    if (typeof window === 'undefined' || !window.kakao?.maps?.load) {
      if (pollAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
        setStatus('error');
        return;
      }
      pollAttemptsRef.current += 1;
      pollTimerRef.current = setTimeout(initMap, 100);
      return;
    }
    window.kakao.maps.load(() => {
      if (!containerRef.current) return;
      const map = new window.kakao.maps.Map(containerRef.current, {
        center: new window.kakao.maps.LatLng(center.lat, center.lng),
        level: 3,
      });
      mapRef.current = map;
      setStatus('ready');
    });
  };

  // SDK가 이미 로드된 경우 (HMR, 두 번째 마운트 등) 바로 초기화
  useEffect(() => {
    if (typeof window !== 'undefined' && window.kakao?.maps) {
      initMap();
    }
    return () => {
      // 언마운트 시 polling 정리 — leak 방지
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // center가 바뀌면 지도 중심 이동
  useEffect(() => {
    if (status !== 'ready' || !mapRef.current) return;
    const latlng = new window.kakao.maps.LatLng(center.lat, center.lng);
    mapRef.current.setCenter(latlng);
  }, [center.lat, center.lng, status]);

  // markers가 바뀌면 기존 핀 제거 후 새로 꽂기
  useEffect(() => {
    if (status !== 'ready' || !mapRef.current) return;

    // 기존 마커 전부 지우기
    markerRefs.current.forEach((m) => m.setMap(null));
    markerRefs.current = [];

    markers.forEach((marker) => {
      const position = new window.kakao.maps.LatLng(marker.lat, marker.lng);
      const kakaoMarker = new window.kakao.maps.Marker({
        position,
        map: mapRef.current ?? undefined,
      });

      if (onMarkerClick && marker.id) {
        const id = marker.id;
        window.kakao.maps.event.addListener(kakaoMarker, 'click', () => {
          onMarkerClick(id);
        });
      }

      markerRefs.current.push(kakaoMarker);
    });
  }, [markers, status, onMarkerClick]);

  return (
    <>
      {/* Next.js next/script는 같은 id 기준으로 dedupe — 항상 렌더해도 한 번만 로드.
          조건부 렌더 시 React 19 strict mode 이중 mount에서 누락될 수 있어 항상 렌더. */}
      <Script
        id="kakao-maps-sdk"
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false`}
        strategy="afterInteractive"
        onReady={initMap}
        onError={() => setStatus('error')}
      />

      <div
        style={{ height }}
        className="w-full rounded-xl overflow-hidden relative"
      >
        {/* 로딩 중 */}
        {status === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-alternative)]">
            <span className="text-[var(--label-alternative)] text-sm">
              지도 로딩 중...
            </span>
          </div>
        )}

        {/* 에러 fallback */}
        {status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-alternative)]">
            <span className="text-[var(--label-alternative)] text-sm">
              지도를 불러올 수 없어요
            </span>
          </div>
        )}

        {/* 실제 지도가 그려질 div — 항상 DOM에 있어야 SDK가 그릴 수 있음 */}
        <div ref={containerRef} style={{ height }} className="w-full" />
      </div>
    </>
  );
}
