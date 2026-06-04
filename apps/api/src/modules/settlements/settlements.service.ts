import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

// OWNER ④ — 소비 항목 기반 분배 + 봉사료·부가세 자동 배분(F8·F9).
@Injectable()
export class SettlementsService {
  constructor(private readonly prisma: PrismaService) {}
  // TODO: 구현
}
