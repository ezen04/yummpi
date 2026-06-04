import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

// ③ 실시간·투표 — Socket.io 클라이언트 싱글톤
export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, { autoConnect: false });
  }
  return socket;
}
