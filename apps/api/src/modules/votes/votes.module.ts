import { Module } from '@nestjs/common';
import { VotesController } from './votes.controller';
import { VotesService } from './votes.service';

// OWNER ③ — 투표 집계·정합성(트랜잭션/Optimistic Lock)·장소확정(F3·F4).
@Module({ controllers: [VotesController], providers: [VotesService] })
export class VotesModule {}
