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
        CustomOverlay: new (options: {
          position: KakaoLatLng;
          content: HTMLElement | string;
          xAnchor?: number;
          yAnchor?: number;
          zIndex?: number;
        }) => KakaoCustomOverlay;
        event: {
          addListener: (
            target: KakaoMapInstance | KakaoMarker,
            type: string,
            handler: () => void
          ) => void;
        };
      };
    };
  }
}

interface KakaoCustomOverlay {
  setMap: (map: KakaoMapInstance | null) => void;
}

interface KakaoLatLng {
  getLat: () => number;
  getLng: () => number;
}

interface KakaoMapInstance {
  setCenter: (latlng: KakaoLatLng) => void;
  getCenter: () => KakaoLatLng;
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

export interface KakaoCustomPin {
  /** React key + 식별자 */
  id: string;
  lat: number;
  lng: number;
  /** 핀 HTML 마크업. 좌표는 핀의 bottom-center 기준으로 anchor된다 (yAnchor=1, xAnchor=0.5). */
  html: string;
  /** 핀 클릭 시 호출 */
  onClick?: () => void;
}

export interface KakaoMapProps {
  /** 지도 중심 좌표 (필수) */
  center: { lat: number; lng: number };
  /** 지도에 표시할 마커 목록 */
  markers?: Marker[];
  /** HTML 기반 커스텀 핀 — MapPin 등 React 컴포넌트의 markup string을 좌표에 anchor해 띄운다. */
  customPins?: KakaoCustomPin[];
  /** 지도 높이 (기본값: '40vh') */
  height?: string;
  /** 마커 클릭 시 호출. 클릭된 마커의 id를 전달 */
  onMarkerClick?: (markerId: string) => void;
  /** 사용자가 지도를 드래그해서 멈출 때 새 중심 좌표를 전달 */
  onCenterChanged?: (center: { lat: number; lng: number }) => void;
  /** 지도 위에 따뜻한 톤(--map-warm-tint) 오버레이를 깔아 yummpi 톤으로 보정 */
  warmTint?: boolean;
  /** 지도 중앙에 십자선을 표시 (위치 선택 UI에서 사용). 핀 자체는 centerOverlay slot으로 합성 */
  showCenterCrosshair?: boolean;
  /** 지도 중앙(crosshair 위)에 합성할 노드. 보통 <MapPin variant="selected" />.
   *  이 노드는 지도 좌표가 아닌 화면 중앙 고정이며, 사용자가 지도를 움직이면 그 아래 좌표가 바뀐다. */
  centerOverlay?: React.ReactNode;
  /** 지도 우측에 떠 있는 floating 버튼 슬롯 */
  floatingSlot?: React.ReactNode;
  /** 지도 위 하단 영역에 absolute로 깔리는 슬롯 (MapBottomCard 등) */
  bottomSlot?: React.ReactNode;
  /** 지도 위 상단 영역에 absolute로 깔리는 슬롯 (floating 검색바 등) */
  topSlot?: React.ReactNode;
}

export function KakaoMap({
  center,
  markers = [],
  customPins = [],
  height = '40vh',
  onMarkerClick,
  onCenterChanged,
  warmTint = false,
  showCenterCrosshair = false,
  centerOverlay,
  floatingSlot,
  bottomSlot,
  topSlot,
}: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMapInstance | null>(null);
  const markerRefs = useRef<KakaoMarker[]>([]);
  const customOverlayRefs = useRef<KakaoCustomOverlay[]>([]);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollAttemptsRef = useRef(0);
  const onCenterChangedRef = useRef(onCenterChanged);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading'
  );

  // 최대 5초(50회 × 100ms) polling 후 실패 처리 — 무한 재시도 방지
  const MAX_POLL_ATTEMPTS = 50;

  // 콜백을 ref로 보관해 dragend 핸들러를 재등록하지 않게
  useEffect(() => {
    onCenterChangedRef.current = onCenterChanged;
  }, [onCenterChanged]);

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

      // 드래그 종료 시 새 중심을 부모로 전달 — ref로 최신 콜백을 호출
      window.kakao.maps.event.addListener(map, 'dragend', () => {
        const cb = onCenterChangedRef.current;
        if (!cb) return;
        const c = map.getCenter();
        cb({ lat: c.getLat(), lng: c.getLng() });
      });

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

  // customPins가 바뀌면 기존 overlay 제거 후 새로 꽂기 (HTML 기반 핀)
  useEffect(() => {
    if (status !== 'ready' || !mapRef.current) return;

    customOverlayRefs.current.forEach((o) => o.setMap(null));
    customOverlayRefs.current = [];

    customPins.forEach((pin) => {
      const position = new window.kakao.maps.LatLng(pin.lat, pin.lng);
      // HTML string → DOM 요소로 감싸서 클릭 핸들러 부착
      const wrap = document.createElement('div');
      wrap.innerHTML = pin.html;
      wrap.style.cursor = pin.onClick ? 'pointer' : 'default';
      if (pin.onClick) {
        wrap.addEventListener('click', pin.onClick);
      }
      const overlay = new window.kakao.maps.CustomOverlay({
        position,
        content: wrap,
        yAnchor: 1, // 핀 bottom이 좌표에 anchor
        xAnchor: 0.5,
        zIndex: 3,
      });
      overlay.setMap(mapRef.current ?? null);
      customOverlayRefs.current.push(overlay);
    });
  }, [customPins, status]);

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
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-alternative)] z-30">
            <span className="text-[var(--label-alternative)] text-sm">
              지도 로딩 중...
            </span>
          </div>
        )}

        {/* 에러 fallback */}
        {status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-alternative)] z-30">
            <span className="text-[var(--label-alternative)] text-sm">
              지도를 불러올 수 없어요
            </span>
          </div>
        )}

        {/* 실제 지도가 그려질 div — 항상 DOM에 있어야 SDK가 그릴 수 있음 */}
        <div ref={containerRef} style={{ height }} className="w-full" />

        {/* warm-tint 오버레이 — 지도 타일의 차가운 톤을 yummpi 따뜻한 톤으로 보정 */}
        {warmTint && (
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none z-10"
            style={{ background: 'var(--map-warm-tint)' }}
          />
        )}

        {/* 중앙 십자선 — 사용자가 지도를 움직여 핀 아래 위치를 맞추는 UX의 가이드 */}
        {showCenterCrosshair && (
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none z-10"
          >
            <div
              className="absolute left-0 right-0 top-1/2 -translate-y-1/2"
              style={{
                height: 1,
                background: 'var(--primary)',
                opacity: 0.35,
              }}
            />
            <div
              className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2"
              style={{
                width: 1,
                background: 'var(--primary)',
                opacity: 0.35,
              }}
            />
          </div>
        )}

        {/* 중앙 핀 — 좌표 고정이 아니라 화면 중앙 고정. 지도가 움직여도 핀은 그 자리 */}
        {centerOverlay && (
          <div
            className="absolute left-1/2 top-1/2 pointer-events-none z-20"
            style={{ transform: 'translate(-50%, -100%)' }}
          >
            {centerOverlay}
          </div>
        )}

        {/* 상단 슬롯 — 보통 검색바 */}
        {topSlot && (
          <div className="absolute top-0 left-0 right-0 z-20 p-4 pointer-events-none">
            <div className="pointer-events-auto">{topSlot}</div>
          </div>
        )}

        {/* 우측 floating 버튼 슬롯 */}
        {floatingSlot && (
          <div className="absolute right-3 bottom-3 z-20 flex flex-col gap-2">
            {floatingSlot}
          </div>
        )}

        {/* 하단 슬롯 — 보통 MapBottomCard */}
        {bottomSlot && (
          <div className="absolute bottom-0 left-0 right-0 z-20">
            {bottomSlot}
          </div>
        )}
      </div>
    </>
  );
}
