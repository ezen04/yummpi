'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from '@yummpi/ui';
import { getSocket } from '@/lib/socket';
import type { ServerToClientEvents } from '@/lib/socket';

export function useSocket(meetingId: string): { isConnected: boolean } {
  const [isConnected, setIsConnected] = useState(false);
  // 연결 실패 안내 토스트는 1회만 — reconnect 시도마다 띄우면 사용자 부담.
  // 정상 연결되면 reset해서 다음 단절 시 다시 알릴 수 있게.
  const errorNotifiedRef = useRef(false);

  useEffect(() => {
    const socket = getSocket();

    socket.auth = { meetingId };

    function onConnect() {
      setIsConnected(true);
      errorNotifiedRef.current = false;
      socket.emit('meeting:join', { meetingId });
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onConnectError() {
      // 토큰 만료·네트워크 차단·서버 다운 등 연결 실패 → 사용자에게 1회 안내.
      // Socket.io가 reconnect를 자동 시도하므로 추가 토스트는 생략.
      if (errorNotifiedRef.current) return;
      errorNotifiedRef.current = true;
      toast.error('실시간 연결이 끊겼어요. 자동으로 다시 연결할게요.');
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    socket.connect();

    if (socket.connected) {
      onConnect();
    }

    return () => {
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
