import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

// OWNER ⑤ — 예약 상태 수동 관리(전→진행→완료) + 참석체크(F5·F6).
@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}
  // TODO: 구현
}
