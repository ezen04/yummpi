import { Controller, Get } from '@nestjs/common';
import { VotesService } from './votes.service';

// OWNER ③ — 투표 집계·정합성(트랜잭션/Optimistic Lock)·장소확정(F3·F4).
@Controller('votes')
export class VotesController {
  constructor(private readonly service: VotesService) {}

  @Get('health')
  health() {
    return { module: 'votes', ok: true };
  }
}
