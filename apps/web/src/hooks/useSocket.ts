'use client';

import { useEffect, useRef, useState } from 'react';
import { getSocket } from '@/lib/socket';
import type { ServerToClientEvents } from '@/lib/socket';

export function useSocket(meetingId: string): { isConnected: boolean } {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    socket.auth = { meetingId };

    function onConnect() {
      setIsConnected(true);
      socket.emit('meeting:join', { meetingId });
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    socket.connect();

    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.emit('meeting:leave', { meetingId });
      socket.disconnect();
    };
  }, [meetingId]);

  return { isConnected };
}

export function useSocketEvent<K extends keyof ServerToClientEvents>(
  event: K,
  handler: ServerToClientEvents[K],
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
