import { createHash } from 'crypto';
import { parse } from 'cookie';
import type { Server, Socket } from 'socket.io';
import { prisma } from '../lib/prisma.js';

export interface SocketData {
  memberId: string;
  meetingId: string;
  role: 'HOST' | 'MEMBER';
}

export function registerAuthMiddleware(io: Server) {
  io.use(async (socket: Socket, next) => {
    const { meetingId } = socket.handshake.auth as { meetingId?: string };

    const cookies = parse(socket.handshake.headers.cookie ?? '');
    const sessionToken =
      cookies['next-auth.session-token'] ??
      cookies['__Secure-next-auth.session-token'];
    const guestToken = meetingId
      ? cookies[`yummpi_guest_${meetingId}`]
      : undefined;

    if (!meetingId) {
      return next(new Error('MISSING_MEETING_ID'));
    }

    try {
      let member = null;

      if (sessionToken) {
        // 회원: DB 세션 토큰으로 userId 조회 → meeting_members 확인
        const session = await prisma.session.findUnique({
          where: { sessionToken },
          select: { userId: true, expires: true },
        });

        if (!session || session.expires < new Date()) {
          return next(new Error('UNAUTHORIZED'));
        }

        member = await prisma.meetingMember.findFirst({
          where: { meetingId, userId: session.userId },
          select: { id: true, role: true },
        });
      } else if (guestToken) {
        // 게스트: 토큰 해시를 meeting_members.guest_token_hash와 비교
        const hash = createHash('sha256').update(guestToken).digest('hex');

        member = await prisma.meetingMember.findFirst({
          where: { meetingId, guestTokenHash: hash },
          select: { id: true, role: true },
        });
      }

      if (!member) {
        return next(new Error('UNAUTHORIZED'));
      }

      socket.data = {
        memberId: member.id,
        meetingId,
        role: member.role,
      } satisfies SocketData;

      next();
    } catch (err) {
      console.error('[auth middleware]', err);
      next(new Error('INTERNAL_ERROR'));
    }
  });
}
