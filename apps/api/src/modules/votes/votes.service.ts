import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

// OWNER ③ — 투표 집계·정합성(트랜잭션/Optimistic Lock)·장소확정(F3·F4).
@Injectable()
export class VotesService {
  constructor(private readonly prisma: PrismaService) {}
  // TODO: 구현
}
