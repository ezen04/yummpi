'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from '@yummpi/ui';
import { getSocket } from '@/lib/socket';
import type { ServerToClientEvents } from '@/lib/socket';

/** 짧은 blip은 자동 복구되므로 즉시 토스트하지 않고 이 시간 이상 끊긴 채면 안내 */
const RECONNECT_NOTICE_DELAY_MS = 3000;

export function useSocket(meetingId: string): { isConnected: boolean } {
  const [isConnected, setIsConnected] = useState(false);
  // 3초 debounce — 끊김 직후 즉시 안내하지 않고 자동 복구 시간을 준다.
  const reconnectTimerRef = useRef<number | null>(null);
  // 끊김 사이클당 토스트 1회 — 재연결 시 reset되어 다음 단절에 다시 알림.
  const notifiedRef = useRef(false);

  useEffect(() => {
    const socket = getSocket();

    socket.auth = { meetingId };

    function clearReconnectNotice() {
      if (reconnectTimerRef.current != null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    }

    function armReconnectNotice() {
      if (reconnectTimerRef.current != null) return;
      reconnectTimerRef.current = window.setTimeout(() => {
        reconnectTimerRef.current = null;
        if (!socket.connected && !notifiedRef.current) {
          notifiedRef.current = true;
          // toast.error(빨강) → 중립 톤 — 자동 복구 중이라 에러로 보이지 않게.
          toast('연결이 잠시 끊겼어요. 다시 연결 중...');
        }
      }, RECONNECT_NOTICE_DELAY_MS);
    }

    function onConnect() {
      clearReconnectNotice();
      notifiedRef.current = false;
      setIsConnected(true);
      socket.emit('meeting:join', { meetingId });
    }

    function onDisconnect(reason: string) {
      setIsConnected(false);
      // 의도적 종료(페이지 이동·서버측 disconnect)는 안내 X.
      if (
        reason === 'io server disconnect' ||
        reason === 'io client disconnect'
      ) {
        return;
      }
      armReconnectNotice();
    }

    function onConnectError() {
      // 초기 접속 실패·재연결 실패 — 자동 재시도 중이라 즉시 안내 X.
      // 3초 이상 미복구면 armReconnectNotice 타이머가 발사.
      armReconnectNotice();
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    socket.connect();

    if (socket.connected) {
      onConnect();
    }

    return () => {
      clearReconnectNotice();
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.emit('meeting:leave', { meetingId });
      socket.disconnect();
    };
  }, [meetingId]);

  return { isConnected };
}

export function useSocketEvent<K extends keyof ServerToClientEvents>(
  event: K,
  handler: ServerToClientEvents[K]
): void {
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  });

  useEffect(() => {
    const socket = getSocket();
    const listener = (...args: unknown[]) => {
      (savedHandler.current as (...a: unknown[]) => void)(...args);
    };

    socket.on(event as never, listener as never);
    return () => {
      socket.off(event as never, listener as never);
    };
  }, [event]);
}
