import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS, castVoteSchema } from '@gatherflow/shared';

// OWNER ③ — 실시간 투표 게이트웨이. 이벤트명은 공용 SOCKET_EVENTS 사용.
@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class VoteGateway {
  @WebSocketServer() server!: Server;

  @SubscribeMessage(SOCKET_EVENTS.JOIN_ROOM)
  join(client: Socket, meetingId: string) {
    client.join(`meeting:${meetingId}`);
  }

  @SubscribeMessage(SOCKET_EVENTS.CAST)
  cast(client: Socket, payload: unknown) {
    const vote = castVoteSchema.parse(payload); // 공용 Zod 검증
    // TODO(③): 트랜잭션으로 upsert(@@unique) → 집계 → 룸 브로드캐스트
    this.server.to(`meeting:${vote.meetingId}`).emit(SOCKET_EVENTS.TALLY, {});
  }
}
