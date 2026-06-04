import { Module } from '@nestjs/common';
import { VoteGateway } from './vote.gateway';

// OWNER ③ — Socket.io 게이트웨이 (Redis adapter는 main.ts에서 주입)
@Module({ providers: [VoteGateway] })
export class RealtimeModule {}
